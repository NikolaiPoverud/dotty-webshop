import 'server-only';
import { createClient } from './server';

// Get current user (server-side only)
export async function getUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

// Get current session (server-side only)
export async function getSession() {
  const supabase = await createClient();
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session) {
    return null;
  }

  return session;
}

// Check if user is admin (for now, any authenticated user is admin)
// You can extend this to check for specific roles or email domains
export async function isAdmin() {
  const user = await getUser();
  return !!user;
}
