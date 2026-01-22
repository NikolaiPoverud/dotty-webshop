'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Loader2, Mail, Lock, AlertCircle, Clock } from 'lucide-react';
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
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<LoginMode>('password');
  const [resetEmailSent, setResetEmailSent] = useState(false);

  // Check for timeout reason
  useEffect(() => {
    const reason = searchParams.get('reason');
    if (reason === 'timeout') {
      setError('Du ble logget ut på grunn av inaktivitet.');
    }
  }, [searchParams]);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // SEC-008: Use rate-limited API route instead of direct Supabase call
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, rememberMe }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          const retryAfter = data.retryAfter || 60;
          throw new Error(`For mange forsøk. Prøv igjen om ${Math.ceil(retryAfter / 60)} minutter.`);
        }
        throw new Error(data.error || 'Feil e-post eller passord');
      }

      // Set the session in Supabase client
      if (data.session) {
        const supabase = createClient();
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });

        // Check if MFA is required
        const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

        if (aalData?.currentLevel === 'aal1' && aalData?.nextLevel === 'aal2') {
          // User has MFA enabled but hasn't verified yet
          router.push('/admin/mfa-verify');
          return;
        }
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
            <span className="text-primary">Dotty.</span>
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
                className={`flex items-center gap-3 p-4 rounded-lg ${
                  searchParams.get('reason') === 'timeout'
                    ? 'bg-warning/10 border border-warning/20 text-warning'
                    : 'bg-error/10 border border-error/20 text-error'
                }`}
              >
                {searchParams.get('reason') === 'timeout' ? (
                  <Clock className="w-5 h-5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                )}
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
                className="space-y-4"
              >
                <div className="space-y-2">
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
                </div>

                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-5 h-5 border border-border rounded bg-background peer-checked:bg-primary peer-checked:border-primary transition-colors" />
                    <svg
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 text-background opacity-0 peer-checked:opacity-100 transition-opacity"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                    Husk meg
                  </span>
                </label>
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
