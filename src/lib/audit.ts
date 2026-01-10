import { createAdminClient } from '@/lib/supabase/admin';

export type AuditAction =
  | 'contact_view'
  | 'contact_delete'
  | 'contact_mark_read'
  | 'order_view'
  | 'order_update'
  | 'product_create'
  | 'product_update'
  | 'product_delete'
  | 'newsletter_unsubscribe'
  | 'newsletter_confirmed'
  | 'gdpr_export_completed'
  | 'gdpr_delete_completed'
  | 'data_request_created';

export type ActorType = 'admin' | 'customer' | 'system';

export interface AuditLogEntry {
  action: AuditAction | string;
  entity_type: string;
  entity_id?: string;
  actor_type: ActorType;
  actor_id?: string;
  details?: Record<string, unknown>;
  ip_address?: string;
}

/**
 * Log an action to the audit log.
 * Failures are logged but do not throw - audit logging should not break operations.
 */
export async function logAudit(entry: AuditLogEntry): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from('audit_log').insert({
    ...entry,
    details: entry.details ?? {},
  });

  if (error) {
    console.error('Failed to write audit log:', error);
  }
}

/**
 * Extract client IP address from request headers.
 * Returns 'unknown' if no forwarded header is present.
 */
export function getIpFromRequest(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (!forwardedFor) return 'unknown';

  const [firstIp] = forwardedFor.split(',');
  return firstIp.trim();
}
