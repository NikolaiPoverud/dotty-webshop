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

/**
 * Log an action to the audit log.
 * Failures are logged but do not throw - audit logging should not break operations.
 */
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

/**
 * SEC-015: Extract User-Agent from request headers.
 * Truncates to 500 chars to prevent oversized entries.
 */
export function getUserAgentFromRequest(request: Request): string | undefined {
  const userAgent = request.headers.get('user-agent');
  if (!userAgent) return undefined;
  // Truncate to prevent extremely long user agents
  return userAgent.slice(0, 500);
}

/**
 * SEC-015: Extract Referer from request headers.
 * Truncates to 2000 chars to prevent oversized entries.
 */
export function getRefererFromRequest(request: Request): string | undefined {
  const referer = request.headers.get('referer');
  if (!referer) return undefined;
  // Truncate to prevent extremely long referers
  return referer.slice(0, 2000);
}

/**
 * SEC-015: Extract all audit-relevant headers from a request.
 * Convenience function to get IP, User-Agent, and Referer in one call.
 */
export function getAuditHeadersFromRequest(request: Request): {
  ip_address: string;
  user_agent?: string;
  referer?: string;
} {
  return {
    ip_address: getIpFromRequest(request),
    user_agent: getUserAgentFromRequest(request),
    referer: getRefererFromRequest(request),
  };
}
