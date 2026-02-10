import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyAdminAuth } from '@/lib/auth/admin-guard';
import { invalidateCollectionCache } from '@/lib/services/collection-service';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const auth = await verifyAdminAuth();
  if (!auth.authorized) return auth.response;

  const { id } = await params;
  const supabase = createAdminClient();
  const body = await request.json();

  // SEC: Only allow updating known fields to prevent arbitrary column writes
  const ALLOWED_FIELDS = ['name', 'slug', 'description', 'display_order', 'shipping_cost', 'is_active', 'is_public'] as const;
  const sanitized: Record<string, unknown> = {};
  for (const key of ALLOWED_FIELDS) {
    if (key in body) sanitized[key] = body[key];
  }

  const { data, error } = await supabase
    .from('collections')
    .update(sanitized)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }
    console.error('Failed to update collection:', error);
    return NextResponse.json({ error: 'Failed to update collection' }, { status: 500 });
  }

  invalidateCollectionCache();
  return NextResponse.json({ data });
}

export async function DELETE(_request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const auth = await verifyAdminAuth();
  if (!auth.authorized) return auth.response;

  const { id } = await params;
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('collections')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('Failed to delete collection:', error);
    return NextResponse.json({ error: 'Failed to delete collection' }, { status: 500 });
  }

  invalidateCollectionCache();
  return NextResponse.json({ success: true });
}
