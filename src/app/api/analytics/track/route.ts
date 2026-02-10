import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient } from '@/lib/supabase/public';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

type EventType = 'page_view' | 'product_view' | 'add_to_cart' | 'purchase';

const VALID_EVENT_TYPES: EventType[] = ['page_view', 'product_view', 'add_to_cart', 'purchase'];
const RATE_LIMIT_CONFIG = { maxRequests: 60, windowMs: 60 * 1000 };
const MAX_PATH_LENGTH = 500;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface TrackRequest {
  event_type: EventType;
  product_id?: string;
  page_path?: string;
  session_id?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const clientIp = getClientIp(request);
    const rateLimitResult = await checkRateLimit(`analytics:${clientIp}`, RATE_LIMIT_CONFIG);

    if (!rateLimitResult.success) {
      return NextResponse.json({ success: true }); // Silent rate limit for analytics
    }

    const body = await request.json() as TrackRequest;

    const { event_type, product_id, page_path, session_id } = body;

    if (!event_type || !VALID_EVENT_TYPES.includes(event_type)) {
      return NextResponse.json({ error: 'Invalid event type' }, { status: 400 });
    }

    // Validate inputs to prevent data pollution
    const sanitizedPath = page_path ? page_path.substring(0, MAX_PATH_LENGTH) : null;
    const validProductId = product_id && UUID_REGEX.test(product_id) ? product_id : null;
    const validSessionId = session_id ? session_id.substring(0, 100) : null;

    const supabase = createPublicClient();

    await supabase.from('analytics_events').insert({
      event_type,
      product_id: validProductId,
      page_path: sanitizedPath,
      session_id: validSessionId,
    });

    return NextResponse.json({ success: true });
  } catch {
    // Silent fail - analytics shouldn't break the site
    return NextResponse.json({ success: true });
  }
}
