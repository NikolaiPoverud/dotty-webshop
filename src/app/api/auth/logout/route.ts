import { createClient } from '@/lib/supabase/server';
import { success, errors } from '@/lib/api-response';

export async function POST(): Promise<Response> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    return errors.internal(error.message);
  }

  return success(null, 'Logged out successfully');
}
