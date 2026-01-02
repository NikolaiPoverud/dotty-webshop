// ARCH-005: Consolidated Supabase clients
// Re-export from client.ts for backwards compatibility
import { createClient } from './client';

// @deprecated Use createClient from './client' instead
export const createAuthClient = createClient;
