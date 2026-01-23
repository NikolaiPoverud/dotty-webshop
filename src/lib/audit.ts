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
  user_agent?: string;
  referer?: string;
}

export async function logAudit(entry: AuditLogEntry): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from('audit_log').insert({
    action: entry.action,
    entity_type: entry.entity_type,
    entity_id: entry.entity_id,
    actor_type: entry.actor_type,
    actor_id: entry.actor_id,
    details: entry.details ?? {},
    ip_address: entry.ip_address,
    user_agent: entry.user_agent,
    referer: entry.referer,
  });

  if (error) {
    console.error('Failed to write audit log:', error);
  }
}

export function getAuditHeadersFromRequest(request: Request): {
  ip_address: string;
  user_agent?: string;
  referer?: string;
} {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const ip_address = forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown';

  const userAgent = request.headers.get('user-agent');
  const user_agent = userAgent ? userAgent.slice(0, 500) : undefined;

  const refererHeader = request.headers.get('referer');
  const referer = refererHeader ? refererHeader.slice(0, 2000) : undefined;

  return { ip_address, user_agent, referer };
}
