import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyAdminAuth } from '@/lib/auth/admin-guard';
import { logAudit } from '@/lib/audit';

/**
 * Manual Data Retention Cleanup (Admin only)
 * POST /api/admin/data-cleanup
 *
 * Same logic as the cron job but authenticated via admin session
 */
export async function POST(request: NextRequest) {
  // Verify admin authentication
  const auth = await verifyAdminAuth();
  if (!auth.authorized) {
    return auth.response;
  }

  const supabase = createAdminClient();
  const results: Record<string, number> = {};
  const errors: string[] = [];

  try {
    // 1. Delete unsubscribed newsletter subscribers after 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: deletedSubscribers, error: subError } = await supabase
      .from('newsletter_subscribers')
      .delete()
      .not('unsubscribed_at', 'is', null)
      .lt('unsubscribed_at', thirtyDaysAgo.toISOString())
      .select('id');

    if (subError) {
      errors.push(`Newsletter cleanup error: ${subError.message}`);
    } else {
      results.newsletter_subscribers_deleted = deletedSubscribers?.length || 0;
    }

    // 2. Delete contact submissions older than 2 years
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

    const { data: deletedContacts, error: contactError } = await supabase
      .from('contact_submissions')
      .delete()
      .lt('created_at', twoYearsAgo.toISOString())
      .select('id');

    if (contactError) {
      errors.push(`Contact cleanup error: ${contactError.message}`);
    } else {
      results.contact_submissions_deleted = deletedContacts?.length || 0;
    }

    // 3. Delete completed data requests older than 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const { data: deletedRequests, error: requestError } = await supabase
      .from('data_requests')
      .delete()
      .eq('status', 'completed')
      .lt('completed_at', ninetyDaysAgo.toISOString())
      .select('id');

    if (requestError) {
      errors.push(`Data requests cleanup error: ${requestError.message}`);
    } else {
      results.data_requests_deleted = deletedRequests?.length || 0;
    }

    // 4. Delete expired cookie consents older than 1 year
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const { data: deletedConsents, error: consentError } = await supabase
      .from('cookie_consents')
      .delete()
      .lt('created_at', oneYearAgo.toISOString())
      .select('id');

    if (consentError) {
      errors.push(`Cookie consents cleanup error: ${consentError.message}`);
    } else {
      results.cookie_consents_deleted = deletedConsents?.length || 0;
    }

    // 5. Delete old audit logs (keep 2 years for compliance)
    const { data: deletedLogs, error: auditError } = await supabase
      .from('audit_log')
      .delete()
      .lt('created_at', twoYearsAgo.toISOString())
      .select('id');

    if (auditError) {
      errors.push(`Audit log cleanup error: ${auditError.message}`);
    } else {
      results.audit_logs_deleted = deletedLogs?.length || 0;
    }

    // 6. Anonymize orders older than 7 years (legal requirement to keep, but anonymize PII)
    const sevenYearsAgo = new Date();
    sevenYearsAgo.setFullYear(sevenYearsAgo.getFullYear() - 7);

    const { data: ordersToAnonymize, error: orderFetchError } = await supabase
      .from('orders')
      .select('id')
      .lt('created_at', sevenYearsAgo.toISOString())
      .not('customer_email', 'eq', 'anonymized@deleted.local');

    if (orderFetchError) {
      errors.push(`Order fetch error: ${orderFetchError.message}`);
    } else if (ordersToAnonymize && ordersToAnonymize.length > 0) {
      const orderIds = ordersToAnonymize.map(o => o.id);

      const { error: orderUpdateError } = await supabase
        .from('orders')
        .update({
          customer_email: 'anonymized@deleted.local',
          customer_name: 'Anonymized',
          customer_phone: '00000000',
          shipping_address: { anonymized: true },
        })
        .in('id', orderIds);

      if (orderUpdateError) {
        errors.push(`Order anonymization error: ${orderUpdateError.message}`);
      } else {
        results.orders_anonymized = ordersToAnonymize.length;
      }
    } else {
      results.orders_anonymized = 0;
    }

    // Log the cleanup action
    await logAudit({
      action: 'manual_data_cleanup',
      entity_type: 'system',
      actor_type: 'admin',
      actor_id: auth.user.id,
      details: { results, errors },
    });

    const totalDeleted = Object.values(results).reduce((a, b) => a + b, 0);

    return NextResponse.json({
      success: errors.length === 0,
      message: `Dataopprydding fullført. ${totalDeleted} poster behandlet.`,
      results,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Manual data cleanup failed:', error);
    return NextResponse.json(
      {
        error: 'Opprydding feilet',
        details: error instanceof Error ? error.message : 'Ukjent feil'
      },
      { status: 500 }
    );
  }
}
