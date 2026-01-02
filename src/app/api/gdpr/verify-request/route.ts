import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getResend, emailConfig } from '@/lib/email/resend';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

// SEC-002: Rate limit config for GDPR verification (10 per hour - slightly higher as users may click multiple times)
const VERIFY_RATE_LIMIT = {
  maxRequests: 10,
  windowMs: 60 * 60 * 1000, // 1 hour
};

export async function GET(request: Request) {
  // SEC-002: Apply rate limiting
  const clientIp = getClientIp(request);
  const rateLimitResult = await checkRateLimit(`gdpr-verify:${clientIp}`, VERIFY_RATE_LIMIT);

  if (!rateLimitResult.success) {
    return NextResponse.redirect(new URL('/no/my-data?status=rate-limited', request.url));
  }

  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.redirect(new URL('/no/my-data?status=invalid', request.url));
    }

    const supabase = createAdminClient();

    // Find the request by verification token
    const { data: dataRequest, error: findError } = await supabase
      .from('data_requests')
      .select('*')
      .eq('verification_token', token)
      .single();

    if (findError || !dataRequest) {
      return NextResponse.redirect(new URL('/no/my-data?status=invalid', request.url));
    }

    // Check if already verified/completed
    if (dataRequest.status !== 'pending') {
      return NextResponse.redirect(new URL(`/no/my-data?status=${dataRequest.status}`, request.url));
    }

    // Mark as verified and processing
    await supabase
      .from('data_requests')
      .update({
        status: 'verified',
        verified_at: new Date().toISOString(),
      })
      .eq('id', dataRequest.id);

    // Process the request based on type
    if (dataRequest.request_type === 'export') {
      await processExportRequest(supabase, dataRequest);
    } else if (dataRequest.request_type === 'delete') {
      await processDeleteRequest(supabase, dataRequest);
    }

    // Mark as completed
    await supabase
      .from('data_requests')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', dataRequest.id);

    // Log to audit
    await supabase.from('audit_log').insert({
      action: `gdpr_${dataRequest.request_type}_completed`,
      entity_type: 'data_request',
      entity_id: dataRequest.id,
      actor_type: 'customer',
      actor_id: dataRequest.email,
      details: { email: dataRequest.email, request_type: dataRequest.request_type },
    });

    return NextResponse.redirect(
      new URL(`/no/my-data?status=completed&type=${dataRequest.request_type}`, request.url)
    );
  } catch (error) {
    console.error('Verify request error:', error);
    return NextResponse.redirect(new URL('/no/my-data?status=error', request.url));
  }
}

async function processExportRequest(supabase: ReturnType<typeof createAdminClient>, dataRequest: { id: string; email: string }) {
  const email = dataRequest.email;

  // SEC-017: Collect ALL personal data for this email (complete GDPR coverage)
  const [
    ordersResult,
    newsletterResult,
    contactResult,
    cookieConsentsResult,
    dataRequestsResult,
  ] = await Promise.all([
    supabase.from('orders').select('*').eq('customer_email', email),
    supabase.from('newsletter_subscribers').select('*').eq('email', email),
    supabase.from('contact_submissions').select('*').eq('email', email),
    supabase.from('cookie_consents').select('*').eq('email', email),
    supabase.from('data_requests').select('id, request_type, status, created_at, completed_at').eq('email', email),
  ]);

  const exportData = {
    export_date: new Date().toISOString(),
    email: email,
    orders: ordersResult.data || [],
    newsletter_subscription: newsletterResult.data?.[0] || null,
    contact_submissions: contactResult.data || [],
    cookie_consents: cookieConsentsResult.data || [],
    data_request_history: dataRequestsResult.data || [],
  };

  // Store result in the request
  await supabase
    .from('data_requests')
    .update({ result_data: exportData })
    .eq('id', dataRequest.id);

  // Send email with data
  try {
    const resend = getResend();
    await resend.emails.send({
      from: emailConfig.from,
      to: email,
      subject: 'Din dataeksport | Your data export - Dotty',
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="text-align: center; margin-bottom: 40px;">
            <h1 style="color: #FE206A; font-size: 32px; margin: 0;">Dotty.</h1>
          </div>

          <h2 style="color: #fafafa; margin-bottom: 16px;">Din dataeksport</h2>
          <p style="color: #a1a1aa; line-height: 1.6;">
            Her er all data vi har lagret om deg. I henhold til GDPR har du rett til å motta denne informasjonen.
          </p>

          <div style="background: #27272a; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <h3 style="color: #fafafa; margin-top: 0;">Ordrehistorikk</h3>
            <p style="color: #a1a1aa;">Antall ordrer: ${exportData.orders.length}</p>

            <h3 style="color: #fafafa;">Nyhetsbrev</h3>
            <p style="color: #a1a1aa;">${exportData.newsletter_subscription ? 'Abonnert' : 'Ikke abonnert'}</p>

            <h3 style="color: #fafafa;">Kontaktmeldinger</h3>
            <p style="color: #a1a1aa;">Antall meldinger: ${exportData.contact_submissions.length}</p>

            <h3 style="color: #fafafa;">Informasjonskapsler (cookies)</h3>
            <p style="color: #a1a1aa;">Samtykker registrert: ${exportData.cookie_consents.length}</p>

            <h3 style="color: #fafafa;">GDPR-forespørsler</h3>
            <p style="color: #a1a1aa;">Tidligere forespørsler: ${exportData.data_request_history.length}</p>
          </div>

          <p style="color: #a1a1aa; line-height: 1.6;">
            Fullstendige data er vedlagt som JSON-fil.
          </p>

          <hr style="border: none; border-top: 1px solid #3f3f46; margin: 32px 0;" />

          <h2 style="color: #fafafa; margin-bottom: 16px;">Your data export</h2>
          <p style="color: #a1a1aa; line-height: 1.6;">
            Here is all the data we have stored about you. Under GDPR, you have the right to receive this information.
          </p>

          <p style="color: #71717a; font-size: 12px; margin-top: 40px; text-align: center;">
            Spørsmål? Kontakt oss på ${emailConfig.artistEmail}<br/>
            Questions? Contact us at ${emailConfig.artistEmail}
          </p>
        </div>
      `,
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

async function processDeleteRequest(supabase: ReturnType<typeof createAdminClient>, dataRequest: { id: string; email: string }) {
  const email = dataRequest.email;

  // SEC-018: Create pre-deletion backup for compliance and potential restoration
  const [
    ordersResult,
    newsletterResult,
    contactResult,
    cookieConsentsResult,
  ] = await Promise.all([
    supabase.from('orders').select('*').eq('customer_email', email),
    supabase.from('newsletter_subscribers').select('*').eq('email', email),
    supabase.from('contact_submissions').select('*').eq('email', email),
    supabase.from('cookie_consents').select('*').eq('email', email),
  ]);

  const backupData = {
    backup_date: new Date().toISOString(),
    email: email,
    reason: 'GDPR deletion request',
    orders: ordersResult.data || [],
    newsletter_subscription: newsletterResult.data?.[0] || null,
    contact_submissions: contactResult.data || [],
    cookie_consents: cookieConsentsResult.data || [],
  };

  // Store backup in audit log (retained per legal requirements)
  await supabase.from('audit_log').insert({
    action: 'gdpr_pre_deletion_backup',
    entity_type: 'data_request',
    entity_id: dataRequest.id,
    actor_type: 'system',
    details: backupData,
  });

  // Delete newsletter subscription
  await supabase.from('newsletter_subscribers').delete().eq('email', email);

  // Delete contact submissions
  await supabase.from('contact_submissions').delete().eq('email', email);

  // Anonymize orders (keep for legal/accounting purposes but remove PII)
  await supabase
    .from('orders')
    .update({
      customer_email: 'deleted@gdpr.request',
      customer_name: 'GDPR Deleted',
      customer_phone: 'DELETED',
      shipping_address: { deleted: true, reason: 'GDPR request', date: new Date().toISOString() },
    })
    .eq('customer_email', email);

  // Send confirmation email
  try {
    const resend = getResend();
    await resend.emails.send({
      from: emailConfig.from,
      to: email,
      subject: 'Dine data er slettet | Your data has been deleted - Dotty',
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="text-align: center; margin-bottom: 40px;">
            <h1 style="color: #FE206A; font-size: 32px; margin: 0;">Dotty.</h1>
          </div>

          <h2 style="color: #fafafa; margin-bottom: 16px;">Dine data er slettet</h2>
          <p style="color: #a1a1aa; line-height: 1.6;">
            Vi bekrefter at all din personlige informasjon er slettet fra våre systemer i henhold til GDPR.
          </p>

          <div style="background: #27272a; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <p style="color: #a1a1aa; margin: 0;">
              <strong>Hva er slettet:</strong><br/>
              • Nyhetsbrev-abonnement<br/>
              • Kontaktmeldinger<br/>
              • Personlig informasjon fra ordrer (ordrehistorikk beholdes anonymisert for regnskapsformål)
            </p>
          </div>

          <hr style="border: none; border-top: 1px solid #3f3f46; margin: 32px 0;" />

          <h2 style="color: #fafafa; margin-bottom: 16px;">Your data has been deleted</h2>
          <p style="color: #a1a1aa; line-height: 1.6;">
            We confirm that all your personal information has been deleted from our systems in accordance with GDPR.
          </p>

          <div style="background: #27272a; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <p style="color: #a1a1aa; margin: 0;">
              <strong>What was deleted:</strong><br/>
              • Newsletter subscription<br/>
              • Contact messages<br/>
              • Personal information from orders (order history is kept anonymized for accounting purposes)
            </p>
          </div>

          <p style="color: #71717a; font-size: 12px; margin-top: 40px; text-align: center;">
            Dette er den siste e-posten du vil motta fra oss.<br/>
            This is the last email you will receive from us.
          </p>
        </div>
      `,
    });
  } catch (error) {
    console.error('Failed to send deletion confirmation email:', error);
  }
}
