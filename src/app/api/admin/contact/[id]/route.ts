import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logAudit, getAuditHeadersFromRequest } from '@/lib/audit';
import { verifyAdminAuth } from '@/lib/auth/admin-guard';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Mark as read/unread
export async function PATCH(request: Request, { params }: RouteParams) {
  const auth = await verifyAdminAuth();
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json();
    const { is_read } = body;

    const supabase = createAdminClient();

    const updateData = {
      is_read,
      read_at: is_read ? new Date().toISOString() : null,
    };

    const { data, error } = await supabase
      .from('contact_submissions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await logAudit({
      action: 'contact_mark_read',
      entity_type: 'contact_submission',
      entity_id: id,
      actor_type: 'admin',
      actor_id: auth.user.id,
      details: { is_read, email: data?.email },
      ...getAuditHeadersFromRequest(request),
    });

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to update contact submission' },
      { status: 500 }
    );
  }
}

// Delete a submission
export async function DELETE(request: Request, { params }: RouteParams) {
  const auth = await verifyAdminAuth();
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;

    const supabase = createAdminClient();

    // First get the submission for audit logging
    const { data: submission } = await supabase
      .from('contact_submissions')
      .select('email, name')
      .eq('id', id)
      .single();

    // Soft delete
    const { error } = await supabase
      .from('contact_submissions')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;

    await logAudit({
      action: 'contact_delete',
      entity_type: 'contact_submission',
      entity_id: id,
      actor_type: 'admin',
      actor_id: auth.user.id,
      details: { email: submission?.email, name: submission?.name },
      ...getAuditHeadersFromRequest(request),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete contact submission' },
      { status: 500 }
    );
  }
}
