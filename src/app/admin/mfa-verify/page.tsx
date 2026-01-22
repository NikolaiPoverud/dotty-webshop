'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Shield, Loader2, AlertCircle, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function MFAVerifyPage(): React.ReactNode {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const redirectTo = searchParams.get('redirect') || '/admin/dashboard';

  const getFactorId = useCallback(async () => {
    const supabase = createClient();

    const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();

    if (factorsError) {
      console.error('Error listing factors:', factorsError);
      router.push('/admin/login');
      return;
    }

    const totpFactors = factorsData?.totp || [];
    const verifiedFactor = totpFactors.find(f => f.status === 'verified');

    if (!verifiedFactor) {
      router.push(redirectTo);
      return;
    }

    setFactorId(verifiedFactor.id);
  }, [router, redirectTo]);

  useEffect(() => {
    getFactorId();
  }, [getFactorId]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const verifyCode = useCallback(async () => {
    if (code.length !== 6 || !factorId || isVerifying) return;

    setError(null);
    setIsVerifying(true);

    const supabase = createClient();

    try {
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      });

      if (challengeError) {
        throw challengeError;
      }

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code,
      });

      if (verifyError) {
        throw verifyError;
      }

      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ugyldig kode';
      setError(message.includes('Invalid') ? 'Ugyldig kode. Prøv igjen.' : message);
      setCode('');
      inputRef.current?.focus();
    } finally {
      setIsVerifying(false);
    }
  }, [code, factorId, isVerifying, router, redirectTo]);

  useEffect(() => {
    if (code.length === 6) {
      verifyCode();
    }
  }, [code, verifyCode]);

  const handleCodeChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 6);
    setCode(cleaned);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && code.length === 6) {
      verifyCode();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">
            <span className="text-primary">Dotty.</span>
            <span>.</span>
          </h1>
          <p className="text-muted-foreground mt-2">Verifisering</p>
        </div>

        <div className="bg-muted rounded-xl p-8 border border-border">
          <div className="text-center mb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.1 }}
              className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <Shield className="w-8 h-8 text-primary" />
            </motion.div>
            <h2 className="text-xl font-semibold mb-2">To-faktor autentisering</h2>
            <p className="text-sm text-muted-foreground">
              Skriv inn den 6-sifrede koden fra autentiseringsappen din.
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 p-4 mb-6 bg-error/10 border border-error/20 rounded-lg text-error"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </motion.div>
          )}

          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={code}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="000000"
                  disabled={isVerifying}
                  className="w-48 px-6 py-4 bg-background border border-border rounded-lg text-center text-2xl tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                  autoComplete="one-time-code"
                />
                {isVerifying && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                )}
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={() => setShowHelp(!showHelp)}
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <HelpCircle className="w-4 h-4" />
                Har du problemer?
              </button>
            </div>

            {showHelp && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-background rounded-lg p-4 text-sm space-y-3"
              >
                <p className="font-medium">Feilsøkingstips:</p>
                <ul className="space-y-2 text-muted-foreground list-disc list-inside">
                  <li>Sjekk at tiden på telefonen din er synkronisert</li>
                  <li>Vent til en ny kode genereres hvis den nåværende snart utløper</li>
                  <li>Sørg for at du bruker riktig konto i autentiseringsappen</li>
                </ul>
                <p className="text-muted-foreground pt-2">
                  Har du fortsatt problemer? Kontakt{' '}
                  <a href="mailto:support@dotty.no" className="text-primary hover:underline">
                    support@dotty.no
                  </a>
                </p>
              </motion.div>
            )}
          </div>
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
