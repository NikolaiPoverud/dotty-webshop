import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyAdminAuth } from '@/lib/auth/admin-guard';

export async function GET(): Promise<NextResponse> {
  const auth = await verifyAdminAuth();
  if (!auth.authorized) return auth.response;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('collections')
    .select('*')
    .is('deleted_at', null)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Failed to fetch collections:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await verifyAdminAuth();
  if (!auth.authorized) return auth.response;

  const supabase = createAdminClient();
  const body = await request.json();

  const { data, error } = await supabase
    .from('collections')
    .insert(body)
    .select()
    .single();

  if (error) {
    console.error('Failed to create collection:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
