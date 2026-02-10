import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyAdminAuth } from '@/lib/auth/admin-guard';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = await verifyAdminAuth();
  if (!auth.authorized) return auth.response;

  const supabase = createAdminClient();
  const { searchParams } = new URL(request.url);

  const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1);
  const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') || '50') || 50));
  const action = searchParams.get('action');
  const entityType = searchParams.get('entity_type');
  const actorType = searchParams.get('actor_type');
  const dateFrom = searchParams.get('date_from');
  const dateTo = searchParams.get('date_to');

  let query = supabase
    .from('audit_log')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (action) query = query.eq('action', action);
  if (entityType) query = query.eq('entity_type', entityType);
  if (actorType) query = query.eq('actor_type', actorType);
  if (dateFrom) query = query.gte('created_at', dateFrom);
  if (dateTo) query = query.lte('created_at', dateTo);

  const offset = (page - 1) * limit;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
  }

  const total = count || 0;
  return NextResponse.json({
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await verifyAdminAuth();
  if (!auth.authorized) return auth.response;

  const { type } = await request.json();
  if (type !== 'filters') {
    return NextResponse.json({ error: 'Invalid request type' }, { status: 400 });
  }

  const supabase = createAdminClient();

  const [actionsResult, entitiesResult] = await Promise.all([
    supabase.from('audit_log').select('action').order('action'),
    supabase.from('audit_log').select('entity_type').order('entity_type'),
  ]);

  const uniqueActions = [...new Set(actionsResult.data?.map((a) => a.action) || [])];
  const uniqueEntities = [...new Set(entitiesResult.data?.map((e) => e.entity_type) || [])];

  return NextResponse.json({
    actions: uniqueActions,
    entityTypes: uniqueEntities,
    actorTypes: ['admin', 'customer', 'system'],
  });
}
