import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyAdminAuth } from '@/lib/auth/admin-guard';
import { logAudit, getAuditHeadersFromRequest } from '@/lib/audit';

function daysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

function yearsAgo(years: number): string {
  const date = new Date();
  date.setFullYear(date.getFullYear() - years);
  return date.toISOString();
}

export async function POST(request: Request): Promise<NextResponse> {
  const auth = await verifyAdminAuth();
  if (!auth.authorized) return auth.response;

  const supabase = createAdminClient();
  const results: Record<string, number> = {};
  const errors: string[] = [];

  async function runCleanup(
    name: string,
    query: PromiseLike<{ data: { id: string }[] | null; error: { message: string } | null }>
  ): Promise<void> {
    const { data, error } = await query;
    if (error) {
      errors.push(`${name} error: ${error.message}`);
    } else {
      results[name] = data?.length || 0;
    }
  }

  await runCleanup(
    'newsletter_subscribers_deleted',
    supabase
      .from('newsletter_subscribers')
      .delete()
      .not('unsubscribed_at', 'is', null)
      .lt('unsubscribed_at', daysAgo(30))
      .select('id')
  );

  await runCleanup(
    'contact_submissions_deleted',
    supabase
      .from('contact_submissions')
      .delete()
      .lt('created_at', yearsAgo(2))
      .select('id')
  );

  await runCleanup(
    'data_requests_deleted',
    supabase
      .from('data_requests')
      .delete()
      .eq('status', 'completed')
      .lt('completed_at', daysAgo(90))
      .select('id')
  );

  await runCleanup(
    'cookie_consents_deleted',
    supabase
      .from('cookie_consents')
      .delete()
      .lt('created_at', yearsAgo(1))
      .select('id')
  );

  await runCleanup(
    'audit_logs_deleted',
    supabase
      .from('audit_log')
      .delete()
      .lt('created_at', yearsAgo(2))
      .select('id')
  );

  const { data: ordersToAnonymize, error: orderFetchError } = await supabase
    .from('orders')
    .select('id')
    .lt('created_at', yearsAgo(7))
    .not('customer_email', 'eq', 'anonymized@deleted.local');

  if (orderFetchError) {
    errors.push(`Order fetch error: ${orderFetchError.message}`);
  } else if (ordersToAnonymize && ordersToAnonymize.length > 0) {
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        customer_email: 'anonymized@deleted.local',
        customer_name: 'Anonymized',
        customer_phone: '00000000',
        shipping_address: { anonymized: true },
      })
      .in('id', ordersToAnonymize.map((o) => o.id));

    if (updateError) {
      errors.push(`Order anonymization error: ${updateError.message}`);
    } else {
      results.orders_anonymized = ordersToAnonymize.length;
    }
  } else {
    results.orders_anonymized = 0;
  }

  await logAudit({
    action: 'manual_data_cleanup',
    entity_type: 'system',
    actor_type: 'admin',
    actor_id: auth.user.id,
    details: { results, errors },
    ...getAuditHeadersFromRequest(request),
  });

  const totalDeleted = Object.values(results).reduce((a, b) => a + b, 0);

  return NextResponse.json({
    success: errors.length === 0,
    message: `Dataopprydding fullført. ${totalDeleted} poster behandlet.`,
    results,
    errors: errors.length > 0 ? errors : undefined,
    timestamp: new Date().toISOString(),
  });
}
