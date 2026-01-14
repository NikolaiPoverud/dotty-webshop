import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyAdminAuth } from '@/lib/auth/admin-guard';
import { validate, testimonialSchema } from '@/lib/validation';

export async function GET() {
  const auth = await verifyAdminAuth();
  if (!auth.authorized) return auth.response;

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('testimonials')
      .select('*')
      .is('deleted_at', null)  // Exclude soft-deleted
      .order('display_order', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Failed to fetch testimonials:', error);
    return NextResponse.json(
      { error: 'Failed to fetch testimonials' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const auth = await verifyAdminAuth();
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json();

    // Validate input
    const validation = validate(body, testimonialSchema);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Get the highest display_order
    const { data: existing } = await supabase
      .from('testimonials')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1);

    const newOrder = (existing?.[0]?.display_order ?? 0) + 1;

    const { data, error } = await supabase
      .from('testimonials')
      .insert({
        ...validation.data,
        display_order: validation.data.display_order ?? newOrder,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Failed to create testimonial:', error);
    return NextResponse.json(
      { error: 'Failed to create testimonial' },
      { status: 500 }
    );
  }
}
