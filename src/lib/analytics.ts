'use client';

type EventType = 'page_view' | 'product_view' | 'add_to_cart' | 'purchase';

function getSessionId(): string {
  if (typeof window === 'undefined') return '';

  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = Math.random().toString(36).substring(2) + Date.now().toString(36);
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
}

export async function trackEvent(
  eventType: EventType,
  productId?: string,
  pagePath?: string,
): Promise<void> {
  try {
    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: eventType,
        product_id: productId,
        page_path: pagePath || (typeof window !== 'undefined' ? window.location.pathname : ''),
        session_id: getSessionId(),
      }),
    });
  } catch {
    // Silent fail
  }
}

export function trackPageView(pagePath?: string): void {
  trackEvent('page_view', undefined, pagePath);
}

export function trackProductView(productId: string): void {
  trackEvent('product_view', productId);
}

export function trackAddToCart(productId: string): void {
  trackEvent('add_to_cart', productId);
}

export function trackPurchase(productId: string): void {
  trackEvent('purchase', productId);
}
