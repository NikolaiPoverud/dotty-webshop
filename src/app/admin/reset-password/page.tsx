'use client';

import { useEffect, useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle, Loader2, Lock } from 'lucide-react';

import { Logo } from '@/components/ui/logo';
import { createClient } from '@/lib/supabase/client';

const ANIMATION_INITIAL = { opacity: 0, y: 20 };
const ANIMATION_ANIMATE = { opacity: 1, y: 0 };

function validatePassword(password: string): string | null {
  if (password.length < 12) {
    return 'Passordet må være minst 12 tegn';
  }

  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);

  if (!hasUppercase || !hasLowercase || !hasNumber) {
    return 'Passordet må inneholde store bokstaver, små bokstaver og tall';
  }

  if (!hasSpecial) {
    return 'Passordet må inneholde minst ett spesialtegn (!@#$%^&* osv.)';
  }

  return null;
}

export default function ResetPasswordPage(): React.ReactElement {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkSession(): Promise<void> {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      setIsValidSession(!!session);
    }

    checkSession();
  }, []);

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passordene samsvarer ikke');
      return;
    }

    const validationError = validatePassword(password);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) {
        throw updateError;
      }

      setSuccess(true);
      setTimeout(() => router.push('/admin/dashboard'), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunne ikke oppdatere passordet');
    } finally {
      setIsLoading(false);
    }
  }

  if (isValidSession === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isValidSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <motion.div
          initial={ANIMATION_INITIAL}
          animate={ANIMATION_ANIMATE}
          className="w-full max-w-md text-center"
        >
          <div className="bg-muted rounded-xl p-8 border border-border">
            <div className="w-16 h-16 bg-error/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-error" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Ugyldig eller utløpt lenke</h2>
            <p className="text-muted-foreground mb-6">
              Tilbakestillingslenken er ugyldig eller har utløpt. Vennligst be om en ny lenke.
            </p>
            <Link
              href="/admin/login"
              className="inline-block px-6 py-3 bg-primary text-background font-medium rounded-lg hover:bg-primary-light transition-colors"
            >
              Tilbake til innlogging
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <motion.div
          initial={ANIMATION_INITIAL}
          animate={ANIMATION_ANIMATE}
          className="w-full max-w-md text-center"
        >
          <div className="bg-muted rounded-xl p-8 border border-border">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle className="w-8 h-8 text-success" />
            </motion.div>
            <h2 className="text-2xl font-bold mb-2">Passord oppdatert!</h2>
            <p className="text-muted-foreground">
              Du blir nå sendt til dashbordet...
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={ANIMATION_INITIAL}
        animate={ANIMATION_ANIMATE}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Logo size="md" className="mx-auto" />
          <p className="text-muted-foreground mt-2">Sett nytt passord</p>
        </div>

        <div className="bg-muted rounded-xl p-8 border border-border">
          <form onSubmit={handleSubmit} className="space-y-6">
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
              <label htmlFor="password" className="block text-sm font-medium">
                Nytt passord
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Minst 12 tegn, store/små bokstaver, tall og spesialtegn"
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-sm font-medium">
                Bekreft passord
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Skriv passordet på nytt"
                  autoComplete="new-password"
                />
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-background font-medium rounded-lg hover:bg-primary-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
              {isLoading ? 'Oppdaterer...' : 'Oppdater passord'}
            </motion.button>
          </form>
        </div>

        <p className="text-center mt-6 text-sm text-muted-foreground">
          <Link href="/admin/login" className="hover:text-primary transition-colors">
            Tilbake til innlogging
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
