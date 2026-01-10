'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Loader2, Mail, Lock, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type LoginMode = 'password' | 'reset-password';

function getButtonText(mode: LoginMode, isLoading: boolean): string {
  if (mode === 'reset-password') {
    return isLoading ? 'Sender...' : 'Send tilbakestillingslenke';
  }
  return isLoading ? 'Logger inn...' : 'Logg inn';
}

export default function AdminLoginPage(): React.ReactNode {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<LoginMode>('password');
  const [resetEmailSent, setResetEmailSent] = useState(false);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const supabase = createClient();

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        if (signInError.message.includes('Invalid login credentials')) {
          throw new Error('Feil e-post eller passord');
        }
        throw signInError;
      }

      router.push('/admin/dashboard');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Noe gikk galt');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const supabase = createClient();

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/admin/reset-password`,
      });

      if (resetError) {
        throw resetError;
      }

      setResetEmailSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunne ikke sende tilbakestillingslenke');
    } finally {
      setIsLoading(false);
    }
  };

  if (resetEmailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md text-center"
        >
          <div className="bg-muted rounded-xl p-8 border border-border">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <Mail className="w-8 h-8 text-primary" />
            </motion.div>
            <h2 className="text-2xl font-bold mb-2">Sjekk e-posten din</h2>
            <p className="text-muted-foreground mb-6">
              Vi har sendt en lenke for å tilbakestille passordet til <span className="text-foreground font-medium">{email}</span>
            </p>
            <button
              onClick={() => {
                setResetEmailSent(false);
                setMode('password');
              }}
              className="text-primary hover:underline text-sm"
            >
              Tilbake til innlogging
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">
            <span className="text-primary">Dotty</span>
            <span>.</span>
          </h1>
          <p className="text-muted-foreground mt-2">Admin innlogging</p>
        </div>

        {/* Login Form */}
        <div className="bg-muted rounded-xl p-8 border border-border">
          {mode === 'reset-password' && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">Tilbakestill passord</h2>
              <p className="text-sm text-muted-foreground">
                Skriv inn e-postadressen din, så sender vi en lenke for å tilbakestille passordet.
              </p>
            </div>
          )}

          <form onSubmit={mode === 'reset-password' ? handleResetPassword : handlePasswordLogin} className="space-y-6">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-4 bg-error/10 border border-error/20 rounded-lg text-error"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </motion.div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium">
                E-post
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="admin@dotty.no"
                  autoComplete="email"
                />
              </div>
            </div>

            {mode === 'password' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                <label htmlFor="password" className="block text-sm font-medium">
                  Passord
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    id="password"
                    type="password"
                    required={mode === 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="********"
                    autoComplete="current-password"
                  />
                </div>
              </motion.div>
            )}

            <motion.button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-background font-medium rounded-lg hover:bg-primary-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
              {getButtonText(mode, isLoading)}
            </motion.button>

            {mode === 'password' && (
              <button
                type="button"
                onClick={() => setMode('reset-password')}
                className="w-full text-sm text-muted-foreground hover:text-primary transition-colors mt-3"
              >
                Glemt passord?
              </button>
            )}

            {mode === 'reset-password' && (
              <button
                type="button"
                onClick={() => setMode('password')}
                className="w-full text-sm text-muted-foreground hover:text-primary transition-colors mt-3"
              >
                Tilbake til innlogging
              </button>
            )}
          </form>
        </div>

        {/* Back to shop link */}
        <p className="text-center mt-6 text-sm text-muted-foreground">
          <Link href="/no" className="hover:text-primary transition-colors">
            Tilbake til shop
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
