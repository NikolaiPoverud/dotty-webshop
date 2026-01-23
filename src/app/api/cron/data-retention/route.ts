import { NextRequest, NextResponse } from 'next/server';

import { getAuditHeadersFromRequest, logAudit } from '@/lib/audit';
import { verifyCronAuth } from '@/lib/cron-auth';
import { createAdminClient } from '@/lib/supabase/admin';

function dateOffset(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

interface CleanupResult {
  results: Record<string, number>;
  errors: string[];
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const authResult = verifyCronAuth(request);
  if (!authResult.authorized) return authResult.response!;

  const supabase = createAdminClient();
  const cleanup: CleanupResult = { results: {}, errors: [] };

  function record(
    key: string,
    data: { id: unknown }[] | null,
    error: { message: string } | null
  ): void {
    if (error) {
      cleanup.errors.push(`${key}: ${error.message}`);
    } else {
      cleanup.results[key] = data?.length ?? 0;
    }
  }

  try {
    const { data: subscribers, error: subErr } = await supabase
      .from('newsletter_subscribers')
      .delete()
      .not('unsubscribed_at', 'is', null)
      .lt('unsubscribed_at', dateOffset(30))
      .select('id');
    record('newsletter_subscribers_deleted', subscribers, subErr);

    const { data: contacts, error: contactErr } = await supabase
      .from('contact_submissions')
      .delete()
      .lt('created_at', dateOffset(730))
      .select('id');
    record('contact_submissions_deleted', contacts, contactErr);

    const { data: requests, error: reqErr } = await supabase
      .from('data_requests')
      .delete()
      .eq('status', 'completed')
      .lt('completed_at', dateOffset(90))
      .select('id');
    record('data_requests_deleted', requests, reqErr);

    const { data: consents, error: consentErr } = await supabase
      .from('cookie_consents')
      .delete()
      .lt('created_at', dateOffset(365))
      .select('id');
    record('cookie_consents_deleted', consents, consentErr);

    const { data: logs, error: logErr } = await supabase
      .from('audit_log')
      .delete()
      .lt('created_at', dateOffset(730))
      .select('id');
    record('audit_logs_deleted', logs, logErr);

    const { data: orders, error: orderFetchErr } = await supabase
      .from('orders')
      .select('id')
      .lt('created_at', dateOffset(2555))
      .not('customer_email', 'eq', 'anonymized@deleted.local');

    if (orderFetchErr) {
      cleanup.errors.push(`Order fetch: ${orderFetchErr.message}`);
    } else if (orders && orders.length > 0) {
      const { error: orderUpdateErr } = await supabase
        .from('orders')
        .update({
          customer_email: 'anonymized@deleted.local',
          customer_name: 'Anonymized',
          customer_phone: '00000000',
          shipping_address: { anonymized: true },
        })
        .in(
          'id',
          orders.map((o) => o.id)
        );

      if (orderUpdateErr) {
        cleanup.errors.push(`Order anonymization: ${orderUpdateErr.message}`);
      } else {
        cleanup.results.orders_anonymized = orders.length;
      }
    } else {
      cleanup.results.orders_anonymized = 0;
    }

    await logAudit({
      action: 'data_retention_cleanup',
      entity_type: 'system',
      actor_type: 'system',
      details: { results: cleanup.results, errors: cleanup.errors },
      ...getAuditHeadersFromRequest(request),
    });

    const totalProcessed = Object.values(cleanup.results).reduce((a, b) => a + b, 0);

    return NextResponse.json({
      success: cleanup.errors.length === 0,
      message: `Data retention cleanup completed. ${totalProcessed} records processed.`,
      results: cleanup.results,
      errors: cleanup.errors.length > 0 ? cleanup.errors : undefined,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Data retention cleanup failed:', error);
    return NextResponse.json(
      {
        error: 'Cleanup failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
