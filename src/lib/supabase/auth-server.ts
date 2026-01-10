import 'server-only';

import type { Session, User } from '@supabase/supabase-js';

import { createClient } from './server.js';

export async function getUser(): Promise<User | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  return error ? null : data.user;
}

export async function getSession(): Promise<Session | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getSession();

  return error ? null : data.session;
}

/**
 * Check if user is authenticated as admin.
 * Currently, any authenticated user is considered an admin.
 * Extend this to check for specific roles or email domains as needed.
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getUser();
  return user !== null;
}
