import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logAudit, getAuditHeadersFromRequest } from '@/lib/audit';

const CRON_SECRET = process.env.CRON_SECRET;

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

interface CleanupContext {
  results: Record<string, number>;
  cleanupErrors: string[];
}

function recordResult(
  ctx: CleanupContext,
  key: string,
  data: { id: unknown }[] | null,
  error: { message: string } | null
): void {
  if (error) {
    ctx.cleanupErrors.push(`${key} error: ${error.message}`);
  } else {
    ctx.results[key] = data?.length || 0;
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const authHeader = request.headers.get('authorization');
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const ctx: CleanupContext = { results: {}, cleanupErrors: [] };

  try {
    // Delete unsubscribed newsletter subscribers after 30 days
    const { data: subscribers, error: subErr } = await supabase
      .from('newsletter_subscribers')
      .delete()
      .not('unsubscribed_at', 'is', null)
      .lt('unsubscribed_at', daysAgo(30))
      .select('id');
    recordResult(ctx, 'newsletter_subscribers_deleted', subscribers, subErr);

    // Delete contact submissions older than 2 years
    const { data: contacts, error: contactErr } = await supabase
      .from('contact_submissions')
      .delete()
      .lt('created_at', yearsAgo(2))
      .select('id');
    recordResult(ctx, 'contact_submissions_deleted', contacts, contactErr);

    // Delete completed data requests older than 90 days
    const { data: requests, error: reqErr } = await supabase
      .from('data_requests')
      .delete()
      .eq('status', 'completed')
      .lt('completed_at', daysAgo(90))
      .select('id');
    recordResult(ctx, 'data_requests_deleted', requests, reqErr);

    // Delete cookie consents older than 1 year
    const { data: consents, error: consentErr } = await supabase
      .from('cookie_consents')
      .delete()
      .lt('created_at', yearsAgo(1))
      .select('id');
    recordResult(ctx, 'cookie_consents_deleted', consents, consentErr);

    // Delete audit logs older than 2 years
    const { data: logs, error: logErr } = await supabase
      .from('audit_log')
      .delete()
      .lt('created_at', yearsAgo(2))
      .select('id');
    recordResult(ctx, 'audit_logs_deleted', logs, logErr);

    // Anonymize orders older than 7 years
    const { data: orders, error: orderFetchErr } = await supabase
      .from('orders')
      .select('id')
      .lt('created_at', yearsAgo(7))
      .not('customer_email', 'eq', 'anonymized@deleted.local');

    if (orderFetchErr) {
      ctx.cleanupErrors.push(`Order fetch error: ${orderFetchErr.message}`);
    } else if (orders && orders.length > 0) {
      const { error: orderUpdateErr } = await supabase
        .from('orders')
        .update({
          customer_email: 'anonymized@deleted.local',
          customer_name: 'Anonymized',
          customer_phone: '00000000',
          shipping_address: { anonymized: true },
        })
        .in('id', orders.map(o => o.id));

      if (orderUpdateErr) {
        ctx.cleanupErrors.push(`Order anonymization error: ${orderUpdateErr.message}`);
      } else {
        ctx.results.orders_anonymized = orders.length;
      }
    } else {
      ctx.results.orders_anonymized = 0;
    }

    await logAudit({
      action: 'data_retention_cleanup',
      entity_type: 'system',
      actor_type: 'system',
      details: { results: ctx.results, errors: ctx.cleanupErrors },
      ...getAuditHeadersFromRequest(request),
    });

    const totalProcessed = Object.values(ctx.results).reduce((a, b) => a + b, 0);

    return NextResponse.json({
      success: ctx.cleanupErrors.length === 0,
      message: `Data retention cleanup completed. ${totalProcessed} records processed.`,
      results: ctx.results,
      errors: ctx.cleanupErrors.length > 0 ? ctx.cleanupErrors : undefined,
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
