'use client';

import type { User as SupabaseUser } from '@supabase/supabase-js';
import { motion } from 'framer-motion';
import { Loader2, LogOut, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { createClient } from '@/lib/supabase/client';

export function UserMenu(): React.ReactNode {
  const router = useRouter();
  const supabaseRef = useRef(createClient());
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const supabase = supabaseRef.current;

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function handleLogout(): Promise<void> {
    setIsLoggingOut(true);

    try {
      await supabaseRef.current.auth.signOut();
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/admin/login');
      router.refresh();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoggingOut(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 px-3 py-2">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const LogoutIcon = isLoggingOut ? Loader2 : LogOut;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 px-3 py-2">
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
          <User className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">
            {user.email?.split('@')[0]}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {user.email}
          </p>
        </div>
      </div>

      <motion.button
        onClick={handleLogout}
        disabled={isLoggingOut}
        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-error/10 text-muted-foreground hover:text-error transition-colors disabled:opacity-50"
        whileHover={{ x: 2 }}
      >
        <LogoutIcon className={`w-5 h-5 ${isLoggingOut ? 'animate-spin' : ''}`} />
        <span>Logg ut</span>
      </motion.button>
    </div>
  );
}
