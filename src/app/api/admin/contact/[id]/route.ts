import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logAudit, getIpFromRequest } from '@/lib/audit';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Mark as read/unread
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { is_read } = body;

    const supabase = createAdminClient();

    const updateData: { is_read: boolean; read_at?: string | null } = {
      is_read,
    };

    if (is_read) {
      updateData.read_at = new Date().toISOString();
    } else {
      updateData.read_at = null;
    }

    const { data, error } = await supabase
      .from('contact_submissions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating contact submission:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
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
  try {
    const { id } = await params;

    const supabase = createAdminClient();

    const { error } = await supabase
      .from('contact_submissions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting contact submission:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete contact submission' },
      { status: 500 }
    );
  }
}
