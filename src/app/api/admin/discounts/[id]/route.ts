import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyAdminAuth } from '@/lib/auth/admin-guard';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdminAuth();
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json();
    const supabase = createAdminClient();

    // SEC: Only allow updating known fields to prevent arbitrary column writes
    const ALLOWED_FIELDS = ['code', 'discount_type', 'discount_value', 'discount_percent', 'discount_amount', 'free_shipping', 'min_order_amount', 'max_uses', 'uses_remaining', 'valid_from', 'valid_until', 'expires_at', 'is_active'] as const;
    const sanitized: Record<string, unknown> = {};
    for (const key of ALLOWED_FIELDS) {
      if (key in body) sanitized[key] = body[key];
    }

    const { data, error } = await supabase
      .from('discount_codes')
      .update(sanitized)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Failed to update discount:', error);
    return NextResponse.json(
      { error: 'Failed to update discount' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdminAuth();
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const supabase = createAdminClient();

    const { error } = await supabase
      .from('discount_codes')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete discount:', error);
    return NextResponse.json(
      { error: 'Failed to delete discount' },
      { status: 500 }
    );
  }
}
