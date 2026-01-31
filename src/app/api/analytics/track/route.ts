import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient } from '@/lib/supabase/public';

type EventType = 'page_view' | 'product_view' | 'add_to_cart' | 'purchase';

interface TrackRequest {
  event_type: EventType;
  product_id?: string;
  page_path?: string;
  session_id?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json() as TrackRequest;

    const { event_type, product_id, page_path, session_id } = body;

    if (!event_type || !['page_view', 'product_view', 'add_to_cart', 'purchase'].includes(event_type)) {
      return NextResponse.json({ error: 'Invalid event type' }, { status: 400 });
    }

    const supabase = createPublicClient();

    await supabase.from('analytics_events').insert({
      event_type,
      product_id: product_id || null,
      page_path: page_path || null,
      session_id: session_id || null,
    });

    return NextResponse.json({ success: true });
  } catch {
    // Silent fail - analytics shouldn't break the site
    return NextResponse.json({ success: true });
  }
}
