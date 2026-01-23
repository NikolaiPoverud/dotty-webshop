import { createAdminClient } from '@/lib/supabase/admin';

export type EmailType =
  | 'order_confirmation'
  | 'new_order_alert'
  | 'shipping_notification'
  | 'delivery_confirmation'
  | 'newsletter'
  | 'gdpr_export'
  | 'password_reset';

export type EmailStatus = 'pending' | 'processing' | 'sent' | 'failed' | 'cancelled';

export interface QueuedEmail {
  id: string;
  email_type: EmailType;
  recipient_email: string;
  subject: string;
  entity_type: string | null;
  entity_id: string | null;
  status: EmailStatus;
  priority: number;
  attempts: number;
  max_attempts: number;
  last_error: string | null;
  next_attempt_at: string | null;
  created_at: string;
  processed_at: string | null;
  metadata: Record<string, unknown>;
}

export interface QueueEmailParams {
  emailType: EmailType;
  recipientEmail: string;
  subject: string;
  entityType?: string;
  entityId?: string;
  priority?: number;
  metadata?: Record<string, unknown>;
}

export async function queueEmail(params: QueueEmailParams): Promise<string | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc('queue_email', {
    p_email_type: params.emailType,
    p_recipient_email: params.recipientEmail,
    p_subject: params.subject,
    p_entity_type: params.entityType ?? null,
    p_entity_id: params.entityId ?? null,
    p_priority: params.priority ?? 0,
    p_metadata: params.metadata ?? {},
  });

  if (error) {
    console.error('[EmailQueue] Failed to queue email:', error);
    return null;
  }

  return data;
}

export async function queueOrderEmails(
  orderId: string,
  customerEmail: string,
  orderNumber: string
): Promise<{ confirmationId: string | null; alertId: string | null }> {
  const [confirmationId, alertId] = await Promise.all([
    queueEmail({
      emailType: 'order_confirmation',
      recipientEmail: customerEmail,
      subject: `Ordrebekreftelse ${orderNumber} – Dotty.`,
      entityType: 'order',
      entityId: orderId,
      priority: 10, // High priority
    }),
    queueEmail({
      emailType: 'new_order_alert',
      recipientEmail: process.env.ARTIST_EMAIL || 'admin@dotty.no',
      subject: `Ny ordre ${orderNumber}`,
      entityType: 'order',
      entityId: orderId,
      priority: 5, // Medium priority
    }),
  ]);

  return { confirmationId, alertId };
}

export async function getPendingEmails(batchSize: number = 10): Promise<QueuedEmail[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc('get_pending_emails', {
    p_batch_size: batchSize,
  });

  if (error) {
    console.error('[EmailQueue] Failed to get pending emails:', error);
    return [];
  }

  return data as QueuedEmail[];
}

export async function markEmailSent(emailId: string): Promise<void> {
  const supabase = createAdminClient();

  const { error } = await supabase.rpc('mark_email_sent', { p_id: emailId });

  if (error) {
    console.error('[EmailQueue] Failed to mark email as sent:', error);
  }
}

export async function markEmailFailed(emailId: string, errorMessage: string): Promise<void> {
  const supabase = createAdminClient();

  const { error } = await supabase.rpc('mark_email_failed', {
    p_id: emailId,
    p_error: errorMessage,
  });

  if (error) {
    console.error('[EmailQueue] Failed to mark email as failed:', error);
  }
}

export async function cleanupEmailQueue(daysToKeep: number = 30): Promise<number> {
  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc('cleanup_email_queue', {
    p_days_to_keep: daysToKeep,
  });

  if (error) {
    console.error('[EmailQueue] Failed to cleanup queue:', error);
    return 0;
  }

  return data || 0;
}

export async function getQueueStats(): Promise<{
  pending: number;
  processing: number;
  sent: number;
  failed: number;
}> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('email_queue')
    .select('status')
    .in('status', ['pending', 'processing', 'sent', 'failed']);

  if (error) {
    console.error('[EmailQueue] Failed to get queue stats:', error);
    return { pending: 0, processing: 0, sent: 0, failed: 0 };
  }

  const stats = { pending: 0, processing: 0, sent: 0, failed: 0 };
  for (const row of data || []) {
    const status = row.status as keyof typeof stats;
    if (status in stats) {
      stats[status]++;
    }
  }

  return stats;
}
