import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyAdminAuth } from '@/lib/auth/admin-guard';

// GET /api/admin/gdpr-stats - Get GDPR compliance statistics
export async function GET() {
  const auth = await verifyAdminAuth();
  if (!auth.authorized) return auth.response;

  try {
    const supabase = createAdminClient();

    // Get date ranges
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Cookie consent stats
    const { count: totalCookieConsents } = await supabase
      .from('cookie_consents')
      .select('*', { count: 'exact', head: true });

    const { count: cookieAccepted } = await supabase
      .from('cookie_consents')
      .select('*', { count: 'exact', head: true })
      .eq('consent_given', true);

    const { count: cookieDeclined } = await supabase
      .from('cookie_consents')
      .select('*', { count: 'exact', head: true })
      .eq('consent_given', false);

    const { count: recentCookieConsents } = await supabase
      .from('cookie_consents')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo.toISOString());

    // Newsletter stats
    const { count: totalSubscribers } = await supabase
      .from('newsletter_subscribers')
      .select('*', { count: 'exact', head: true });

    const { count: confirmedSubscribers } = await supabase
      .from('newsletter_subscribers')
      .select('*', { count: 'exact', head: true })
      .eq('is_confirmed', true)
      .is('unsubscribed_at', null);

    const { count: unconfirmedSubscribers } = await supabase
      .from('newsletter_subscribers')
      .select('*', { count: 'exact', head: true })
      .eq('is_confirmed', false)
      .is('unsubscribed_at', null);

    const { count: unsubscribed } = await supabase
      .from('newsletter_subscribers')
      .select('*', { count: 'exact', head: true })
      .not('unsubscribed_at', 'is', null);

    const { count: recentSubscribers } = await supabase
      .from('newsletter_subscribers')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo.toISOString());

    // Data requests stats
    const { count: totalDataRequests } = await supabase
      .from('data_requests')
      .select('*', { count: 'exact', head: true });

    const { count: pendingRequests } = await supabase
      .from('data_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    const { count: completedRequests } = await supabase
      .from('data_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed');

    const { data: requestsByType } = await supabase
      .from('data_requests')
      .select('request_type')
      .order('request_type');

    const exportRequests = requestsByType?.filter(r => r.request_type === 'export').length || 0;
    const deleteRequests = requestsByType?.filter(r => r.request_type === 'delete').length || 0;

    // Recent data requests
    const { data: recentRequests } = await supabase
      .from('data_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    // Order consent stats
    const { count: totalOrders } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });

    const { count: ordersWithPrivacyConsent } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .not('privacy_accepted_at', 'is', null);

    const { count: ordersWithNewsletterOptIn } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('newsletter_opted_in', true);

    // Contact submissions
    const { count: totalContacts } = await supabase
      .from('contact_submissions')
      .select('*', { count: 'exact', head: true });

    // Audit log stats
    const { count: totalAuditLogs } = await supabase
      .from('audit_log')
      .select('*', { count: 'exact', head: true });

    const { count: recentAuditLogs } = await supabase
      .from('audit_log')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo.toISOString());

    // Calculate consent rate
    const cookieConsentRate = totalCookieConsents
      ? Math.round(((cookieAccepted || 0) / totalCookieConsents) * 100)
      : 0;

    const newsletterConfirmRate = totalSubscribers
      ? Math.round(((confirmedSubscribers || 0) / (totalSubscribers || 1)) * 100)
      : 0;

    return NextResponse.json({
      cookieConsent: {
        total: totalCookieConsents || 0,
        accepted: cookieAccepted || 0,
        declined: cookieDeclined || 0,
        acceptRate: cookieConsentRate,
        last30Days: recentCookieConsents || 0,
      },
      newsletter: {
        total: totalSubscribers || 0,
        confirmed: confirmedSubscribers || 0,
        unconfirmed: unconfirmedSubscribers || 0,
        unsubscribed: unsubscribed || 0,
        confirmRate: newsletterConfirmRate,
        last30Days: recentSubscribers || 0,
      },
      dataRequests: {
        total: totalDataRequests || 0,
        pending: pendingRequests || 0,
        completed: completedRequests || 0,
        exportRequests,
        deleteRequests,
        recent: recentRequests || [],
      },
      orders: {
        total: totalOrders || 0,
        withPrivacyConsent: ordersWithPrivacyConsent || 0,
        withNewsletterOptIn: ordersWithNewsletterOptIn || 0,
        privacyConsentRate: totalOrders
          ? Math.round(((ordersWithPrivacyConsent || 0) / totalOrders) * 100)
          : 0,
      },
      contacts: {
        total: totalContacts || 0,
      },
      auditLog: {
        total: totalAuditLogs || 0,
        last30Days: recentAuditLogs || 0,
      },
      lastUpdated: now.toISOString(),
    });
  } catch (error) {
    console.error('Failed to fetch GDPR stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch GDPR stats' },
      { status: 500 }
    );
  }
}
