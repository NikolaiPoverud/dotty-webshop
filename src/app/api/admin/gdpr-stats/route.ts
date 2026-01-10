import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyAdminAuth } from '@/lib/auth/admin-guard';

function calculateRate(numerator: number, denominator: number): number {
  return denominator > 0 ? Math.round((numerator / denominator) * 100) : 0;
}

export async function GET(): Promise<NextResponse> {
  const auth = await verifyAdminAuth();
  if (!auth.authorized) return auth.response;

  const supabase = createAdminClient();
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();

  const countQuery = (table: string) =>
    supabase.from(table).select('*', { count: 'exact', head: true });

  const [
    totalCookieConsentsResult,
    cookieAcceptedResult,
    cookieDeclinedResult,
    recentCookieConsentsResult,
    totalSubscribersResult,
    confirmedSubscribersResult,
    unconfirmedSubscribersResult,
    unsubscribedResult,
    recentSubscribersResult,
    totalDataRequestsResult,
    pendingRequestsResult,
    completedRequestsResult,
    requestsByTypeResult,
    recentRequestsResult,
    totalOrdersResult,
    ordersWithPrivacyConsentResult,
    ordersWithNewsletterOptInResult,
    totalContactsResult,
    totalAuditLogsResult,
    recentAuditLogsResult,
  ] = await Promise.all([
    countQuery('cookie_consents'),
    countQuery('cookie_consents').eq('consent_given', true),
    countQuery('cookie_consents').eq('consent_given', false),
    countQuery('cookie_consents').gte('created_at', thirtyDaysAgoISO),
    countQuery('newsletter_subscribers'),
    countQuery('newsletter_subscribers').eq('is_confirmed', true).is('unsubscribed_at', null),
    countQuery('newsletter_subscribers').eq('is_confirmed', false).is('unsubscribed_at', null),
    countQuery('newsletter_subscribers').not('unsubscribed_at', 'is', null),
    countQuery('newsletter_subscribers').gte('created_at', thirtyDaysAgoISO),
    countQuery('data_requests'),
    countQuery('data_requests').eq('status', 'pending'),
    countQuery('data_requests').eq('status', 'completed'),
    supabase.from('data_requests').select('request_type').order('request_type'),
    supabase.from('data_requests').select('*').order('created_at', { ascending: false }).limit(5),
    countQuery('orders'),
    countQuery('orders').not('privacy_accepted_at', 'is', null),
    countQuery('orders').eq('newsletter_opted_in', true),
    countQuery('contact_submissions'),
    countQuery('audit_log'),
    countQuery('audit_log').gte('created_at', thirtyDaysAgoISO),
  ]);

  const totalCookieConsents = totalCookieConsentsResult.count || 0;
  const cookieAccepted = cookieAcceptedResult.count || 0;
  const cookieDeclined = cookieDeclinedResult.count || 0;
  const totalSubscribers = totalSubscribersResult.count || 0;
  const confirmedSubscribers = confirmedSubscribersResult.count || 0;
  const totalOrders = totalOrdersResult.count || 0;
  const ordersWithPrivacyConsent = ordersWithPrivacyConsentResult.count || 0;

  const requestTypes = requestsByTypeResult.data || [];
  const exportRequests = requestTypes.filter((r) => r.request_type === 'export').length;
  const deleteRequests = requestTypes.filter((r) => r.request_type === 'delete').length;

  return NextResponse.json({
    cookieConsent: {
      total: totalCookieConsents,
      accepted: cookieAccepted,
      declined: cookieDeclined,
      acceptRate: calculateRate(cookieAccepted, totalCookieConsents),
      last30Days: recentCookieConsentsResult.count || 0,
    },
    newsletter: {
      total: totalSubscribers,
      confirmed: confirmedSubscribers,
      unconfirmed: unconfirmedSubscribersResult.count || 0,
      unsubscribed: unsubscribedResult.count || 0,
      confirmRate: calculateRate(confirmedSubscribers, totalSubscribers),
      last30Days: recentSubscribersResult.count || 0,
    },
    dataRequests: {
      total: totalDataRequestsResult.count || 0,
      pending: pendingRequestsResult.count || 0,
      completed: completedRequestsResult.count || 0,
      exportRequests,
      deleteRequests,
      recent: recentRequestsResult.data || [],
    },
    orders: {
      total: totalOrders,
      withPrivacyConsent: ordersWithPrivacyConsent,
      withNewsletterOptIn: ordersWithNewsletterOptInResult.count || 0,
      privacyConsentRate: calculateRate(ordersWithPrivacyConsent, totalOrders),
    },
    contacts: {
      total: totalContactsResult.count || 0,
    },
    auditLog: {
      total: totalAuditLogsResult.count || 0,
      last30Days: recentAuditLogsResult.count || 0,
    },
    lastUpdated: now.toISOString(),
  });
}
