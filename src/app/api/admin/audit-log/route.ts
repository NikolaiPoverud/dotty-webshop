import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyAdminAuth } from '@/lib/auth/admin-guard';

// GET /api/admin/audit-log - List audit logs with filtering
export async function GET(request: NextRequest) {
  const auth = await verifyAdminAuth();
  if (!auth.authorized) return auth.response;

  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const action = searchParams.get('action');
    const entityType = searchParams.get('entity_type');
    const actorType = searchParams.get('actor_type');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');

    let query = supabase
      .from('audit_log')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // Apply filters
    if (action) {
      query = query.eq('action', action);
    }
    if (entityType) {
      query = query.eq('entity_type', entityType);
    }
    if (actorType) {
      query = query.eq('actor_type', actorType);
    }
    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }
    if (dateTo) {
      query = query.lte('created_at', dateTo);
    }

    // Pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching audit logs:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Failed to fetch audit logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}

// GET distinct values for filters
export async function POST(request: NextRequest) {
  const auth = await verifyAdminAuth();
  if (!auth.authorized) return auth.response;

  try {
    const supabase = createAdminClient();
    const { type } = await request.json();

    if (type === 'filters') {
      // Get distinct actions
      const { data: actions } = await supabase
        .from('audit_log')
        .select('action')
        .order('action');

      const uniqueActions = [...new Set(actions?.map(a => a.action) || [])];

      // Get distinct entity types
      const { data: entities } = await supabase
        .from('audit_log')
        .select('entity_type')
        .order('entity_type');

      const uniqueEntities = [...new Set(entities?.map(e => e.entity_type) || [])];

      return NextResponse.json({
        actions: uniqueActions,
        entityTypes: uniqueEntities,
        actorTypes: ['admin', 'customer', 'system'],
      });
    }

    return NextResponse.json({ error: 'Invalid request type' }, { status: 400 });
  } catch (error) {
    console.error('Failed to fetch filter options:', error);
    return NextResponse.json(
      { error: 'Failed to fetch filter options' },
      { status: 500 }
    );
  }
}
