'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  ShieldCheck,
  ShieldX,
  Loader2,
  Copy,
  Check,
  AlertCircle,
  Smartphone,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Factor } from '@supabase/supabase-js';

type MFAStatus = 'loading' | 'disabled' | 'enrolling' | 'enabled';

interface EnrollmentData {
  id: string;
  qrCode: string;
  secret: string;
}

function getErrorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

export default function SecuritySettingsPage(): React.ReactNode {
  const [status, setStatus] = useState<MFAStatus>('loading');
  const [enrollment, setEnrollment] = useState<EnrollmentData | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [factors, setFactors] = useState<Factor[]>([]);

  const checkMFAStatus = useCallback(async function checkMFAStatus() {
    const supabase = createClient();

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();

    if (factorsError) {
      console.error('Error listing factors:', factorsError);
      setStatus('disabled');
      return;
    }

    const totpFactors = factorsData?.totp || [];
    setFactors(totpFactors);

    const hasVerifiedFactor = totpFactors.some((f) => f.status === 'verified');
    setStatus(hasVerifiedFactor ? 'enabled' : 'disabled');
  }, []);

  useEffect(
    function initMFAStatus() {
      checkMFAStatus();
    },
    [checkMFAStatus]
  );

  async function startEnrollment(): Promise<void> {
    setError(null);
    setIsProcessing(true);

    const supabase = createClient();

    const { data, error: enrollError } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: 'Authenticator App',
    });

    setIsProcessing(false);

    if (enrollError) {
      setError(getErrorMessage(enrollError, 'Kunne ikke starte oppsett av 2FA'));
      return;
    }

    if (data) {
      setEnrollment({
        id: data.id,
        qrCode: data.totp.qr_code,
        secret: data.totp.secret,
      });
      setStatus('enrolling');
    }
  }

  async function verifyEnrollment(): Promise<void> {
    if (verificationCode.length !== 6 || !enrollment) return;

    setError(null);
    setIsProcessing(true);

    const supabase = createClient();

    const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
      factorId: enrollment.id,
    });

    if (challengeError) {
      setError(getErrorMessage(challengeError, 'Ugyldig kode. Prøv igjen.'));
      setIsProcessing(false);
      return;
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId: enrollment.id,
      challengeId: challengeData.id,
      code: verificationCode,
    });

    setIsProcessing(false);

    if (verifyError) {
      setError(getErrorMessage(verifyError, 'Ugyldig kode. Prøv igjen.'));
      return;
    }

    setStatus('enabled');
    setEnrollment(null);
    setVerificationCode('');
    await checkMFAStatus();
  }

  async function disableMFA(factorId: string): Promise<void> {
    setError(null);
    setIsProcessing(true);

    const supabase = createClient();

    const { error: unenrollError } = await supabase.auth.mfa.unenroll({ factorId });

    setIsProcessing(false);

    if (unenrollError) {
      setError(getErrorMessage(unenrollError, 'Kunne ikke deaktivere 2FA'));
      return;
    }

    setStatus('disabled');
    await checkMFAStatus();
  }

  async function cancelEnrollment(): Promise<void> {
    if (enrollment) {
      const supabase = createClient();
      await supabase.auth.mfa.unenroll({ factorId: enrollment.id }).catch(() => {});
    }
    setEnrollment(null);
    setVerificationCode('');
    setStatus('disabled');
    setError(null);
  }

  async function copySecret(): Promise<void> {
    if (!enrollment?.secret) return;

    const success = await navigator.clipboard
      .writeText(enrollment.secret)
      .then(() => true)
      .catch(() => false);

    if (success) {
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    } else {
      setError('Kunne ikke kopiere koden');
    }
  }

  function handleCodeChange(value: string): void {
    const cleaned = value.replace(/\D/g, '').slice(0, 6);
    setVerificationCode(cleaned);
  }

  useEffect(
    function autoSubmitVerificationCode() {
      if (verificationCode.length === 6 && status === 'enrolling') {
        verifyEnrollment();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Auto-submit should only trigger on code/status change
    [verificationCode, status]
  );

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Sikkerhet</h1>
        <p className="text-muted-foreground">
          Administrer to-faktor autentisering og andre sikkerhetsinnstillinger.
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

      <div className="bg-muted rounded-xl border border-border overflow-hidden">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-full ${status === 'enabled' ? 'bg-green-500/20' : 'bg-muted-foreground/20'}`}>
              {status === 'enabled' ? (
                <ShieldCheck className="w-6 h-6 text-green-500" />
              ) : (
                <Shield className="w-6 h-6 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold">To-faktor autentisering (2FA)</h2>
              <p className="text-sm text-muted-foreground">
                {status === 'enabled'
                  ? 'Kontoen din er beskyttet med 2FA'
                  : 'Legg til et ekstra lag med sikkerhet til kontoen din'}
              </p>
            </div>
            {status === 'enabled' && (
              <span className="px-3 py-1 bg-green-500/20 text-green-500 text-sm font-medium rounded-full">
                Aktivert
              </span>
            )}
          </div>
        </div>

        <div className="p-6">
          {status === 'disabled' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                To-faktor autentisering legger til et ekstra lag med sikkerhet ved å kreve
                en engangskode fra en autentiseringsapp i tillegg til passordet ditt.
              </p>
              <button
                onClick={startEnrollment}
                disabled={isProcessing}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-background font-medium rounded-lg hover:bg-primary-light disabled:opacity-50 transition-colors"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Shield className="w-4 h-4" />
                )}
                Aktiver 2FA
              </button>
            </div>
          )}

          {status === 'enrolling' && enrollment && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 p-2 bg-background rounded-lg">
                  <Smartphone className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium mb-1">1. Installer en autentiseringsapp</h3>
                  <p className="text-sm text-muted-foreground">
                    Last ned Google Authenticator, Microsoft Authenticator, eller en annen
                    TOTP-kompatibel app på mobilen din.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 p-2 bg-background rounded-lg">
                  <span className="text-primary font-bold">2</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-medium mb-3">2. Skann QR-koden</h3>
                  <div className="bg-white p-4 rounded-lg inline-block">
                    {/* eslint-disable-next-line @next/next/no-img-element -- QR code is a base64 data URL from Supabase */}
                    <img
                      src={enrollment.qrCode}
                      alt="QR-kode for 2FA"
                      className="w-48 h-48"
                    />
                  </div>
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground mb-2">
                      Eller skriv inn denne koden manuelt:
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 px-3 py-2 bg-background rounded font-mono text-sm break-all">
                        {enrollment.secret}
                      </code>
                      <button
                        onClick={copySecret}
                        className="p-2 hover:bg-background rounded transition-colors"
                        title="Kopier"
                      >
                        {copiedSecret ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4 text-muted-foreground" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 p-2 bg-background rounded-lg">
                  <span className="text-primary font-bold">3</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-medium mb-3">3. Skriv inn verifiseringskoden</h3>
                  <div className="flex items-center gap-4">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      value={verificationCode}
                      onChange={(e) => handleCodeChange(e.target.value)}
                      placeholder="000000"
                      className="w-32 px-4 py-3 bg-background border border-border rounded-lg text-center text-xl tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
                      autoFocus
                    />
                    {isProcessing && (
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <button
                  onClick={cancelEnrollment}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Avbryt oppsett
                </button>
              </div>
            </motion.div>
          )}

          {status === 'enabled' && (
            <div className="space-y-4">
              {factors
                .filter((factor) => factor.status === 'verified')
                .map((factor) => (
                  <div
                    key={factor.id}
                    className="flex items-center justify-between p-4 bg-background rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="w-5 h-5 text-green-500" />
                      <div>
                        <p className="font-medium">
                          {factor.friendly_name || 'Authenticator App'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Lagt til {new Date(factor.created_at).toLocaleDateString('no-NO')}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => disableMFA(factor.id)}
                      disabled={isProcessing}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm text-error hover:bg-error/10 rounded transition-colors"
                    >
                      {isProcessing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <ShieldX className="w-4 h-4" />
                      )}
                      Deaktiver
                    </button>
                  </div>
                ))}

              <p className="text-sm text-muted-foreground">
                Hvis du deaktiverer 2FA, vil kontoen din kun være beskyttet med passord.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
