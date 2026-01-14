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

  const { data, error } = await supabase
    .from('collections')
    .update(body)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }
    console.error('Failed to update collection:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Invalidate collection cache after mutation
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Invalidate collection cache after mutation
  invalidateCollectionCache();

  return NextResponse.json({ success: true });
}
