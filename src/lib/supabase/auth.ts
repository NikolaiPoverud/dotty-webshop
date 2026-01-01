import { createClient } from './server';
import { createBrowserClient } from '@supabase/ssr';

// Browser client for client components
export function createAuthClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Get current user (server-side)
export async function getUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

// Get current session (server-side)
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
