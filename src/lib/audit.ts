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
 * Log an action to the audit log
 */
export async function logAudit(entry: AuditLogEntry): Promise<void> {
  try {
    const supabase = createAdminClient();

    await supabase.from('audit_log').insert({
      action: entry.action,
      entity_type: entry.entity_type,
      entity_id: entry.entity_id,
      actor_type: entry.actor_type,
      actor_id: entry.actor_id,
      details: entry.details || {},
      ip_address: entry.ip_address,
    });
  } catch (error) {
    // Log to console but don't throw - audit logging should not break operations
    console.error('Failed to write audit log:', error);
  }
}

/**
 * Get IP address from request headers
 */
export function getIpFromRequest(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  return forwarded ? forwarded.split(',')[0].trim() : 'unknown';
}
