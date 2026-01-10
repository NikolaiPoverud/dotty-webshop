import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getResend, emailConfig } from '@/lib/email/resend';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { gdprDataExportTemplate, gdprDeletionConfirmationTemplate } from '@/lib/email/templates';

type AdminClient = ReturnType<typeof createAdminClient>;

interface DataRequest {
  id: string;
  email: string;
  request_type: 'export' | 'delete';
  status: string;
}

const VERIFY_RATE_LIMIT = {
  maxRequests: 10,
  windowMs: 60 * 60 * 1000,
};

function redirectTo(request: Request, path: string): NextResponse {
  return NextResponse.redirect(new URL(path, request.url));
}

export async function GET(request: Request): Promise<NextResponse> {
  const clientIp = getClientIp(request);
  const rateLimitResult = await checkRateLimit(`gdpr-verify:${clientIp}`, VERIFY_RATE_LIMIT);

  if (!rateLimitResult.success) {
    return redirectTo(request, '/no/my-data?status=rate-limited');
  }

  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return redirectTo(request, '/no/my-data?status=invalid');
    }

    const supabase = createAdminClient();

    const { data: dataRequest, error: findError } = await supabase
      .from('data_requests')
      .select('*')
      .eq('verification_token', token)
      .single();

    if (findError || !dataRequest) {
      return redirectTo(request, '/no/my-data?status=invalid');
    }

    if (dataRequest.status !== 'pending') {
      return redirectTo(request, `/no/my-data?status=${dataRequest.status}`);
    }

    await supabase
      .from('data_requests')
      .update({ status: 'verified', verified_at: new Date().toISOString() })
      .eq('id', dataRequest.id);

    if (dataRequest.request_type === 'export') {
      await processExportRequest(supabase, dataRequest);
    } else if (dataRequest.request_type === 'delete') {
      await processDeleteRequest(supabase, dataRequest);
    }

    await supabase
      .from('data_requests')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', dataRequest.id);

    await supabase.from('audit_log').insert({
      action: `gdpr_${dataRequest.request_type}_completed`,
      entity_type: 'data_request',
      entity_id: dataRequest.id,
      actor_type: 'customer',
      actor_id: dataRequest.email,
      details: { email: dataRequest.email, request_type: dataRequest.request_type },
    });

    return redirectTo(request, `/no/my-data?status=completed&type=${dataRequest.request_type}`);
  } catch (error) {
    console.error('Verify request error:', error);
    return redirectTo(request, '/no/my-data?status=error');
  }
}

async function fetchUserData(supabase: AdminClient, email: string) {
  const [orders, newsletter, contact, cookies, requests] = await Promise.all([
    supabase.from('orders').select('*').eq('customer_email', email),
    supabase.from('newsletter_subscribers').select('*').eq('email', email),
    supabase.from('contact_submissions').select('*').eq('email', email),
    supabase.from('cookie_consents').select('*').eq('email', email),
    supabase.from('data_requests').select('id, request_type, status, created_at, completed_at').eq('email', email),
  ]);

  return {
    orders: orders.data || [],
    newsletter_subscription: newsletter.data?.[0] || null,
    contact_submissions: contact.data || [],
    cookie_consents: cookies.data || [],
    data_request_history: requests.data || [],
  };
}

async function processExportRequest(supabase: AdminClient, dataRequest: DataRequest): Promise<void> {
  const { email, id } = dataRequest;
  const userData = await fetchUserData(supabase, email);

  const exportData = {
    export_date: new Date().toISOString(),
    email,
    ...userData,
  };

  await supabase.from('data_requests').update({ result_data: exportData }).eq('id', id);

  try {
    const resend = getResend();
    await resend.emails.send({
      from: emailConfig.from,
      to: email,
      subject: 'Din dataeksport | Your data export - Dotty',
      html: gdprDataExportTemplate(
        {
          ordersCount: exportData.orders.length,
          isSubscribed: !!exportData.newsletter_subscription,
          contactCount: exportData.contact_submissions.length,
          cookieConsentsCount: exportData.cookie_consents.length,
          requestsCount: exportData.data_request_history.length,
        },
        emailConfig.artistEmail
      ),
      attachments: [
        {
          filename: 'dotty-data-export.json',
          content: Buffer.from(JSON.stringify(exportData, null, 2)).toString('base64'),
        },
      ],
    });
  } catch (error) {
    console.error('Failed to send export email:', error);
  }
}

async function processDeleteRequest(supabase: AdminClient, dataRequest: DataRequest): Promise<void> {
  const { email, id } = dataRequest;
  const userData = await fetchUserData(supabase, email);

  const backupData = {
    backup_date: new Date().toISOString(),
    email,
    reason: 'GDPR deletion request',
    orders: userData.orders,
    newsletter_subscription: userData.newsletter_subscription,
    contact_submissions: userData.contact_submissions,
    cookie_consents: userData.cookie_consents,
  };

  await supabase.from('audit_log').insert({
    action: 'gdpr_pre_deletion_backup',
    entity_type: 'data_request',
    entity_id: id,
    actor_type: 'system',
    details: backupData,
  });

  await Promise.all([
    supabase.from('newsletter_subscribers').delete().eq('email', email),
    supabase.from('contact_submissions').delete().eq('email', email),
    supabase
      .from('orders')
      .update({
        customer_email: 'deleted@gdpr.request',
        customer_name: 'GDPR Deleted',
        customer_phone: 'DELETED',
        shipping_address: { deleted: true, reason: 'GDPR request', date: new Date().toISOString() },
      })
      .eq('customer_email', email),
  ]);

  try {
    const resend = getResend();
    await resend.emails.send({
      from: emailConfig.from,
      to: email,
      subject: 'Dine data er slettet | Your data has been deleted - Dotty',
      html: gdprDeletionConfirmationTemplate(),
    });
  } catch (error) {
    console.error('Failed to send deletion confirmation email:', error);
  }
}
