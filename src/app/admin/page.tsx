'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Lock, Loader2, Eye, EyeOff } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [step, setStep] = useState<'password' | 'totp'>('password');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // TODO: Validate password against hashed value
    // For demo, accept 'dotty2024'
    await new Promise((r) => setTimeout(r, 500));

    if (password === 'dotty2024') {
      setStep('totp');
    } else {
      setError('Feil passord');
    }
    setIsLoading(false);
  };

  const handleTotpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // TODO: Validate TOTP code
    // For demo, accept '123456'
    await new Promise((r) => setTimeout(r, 500));

    if (totpCode === '123456') {
      // Set session cookie
      document.cookie = 'admin_session=valid; path=/admin; max-age=86400';
      router.push('/admin/dashboard');
    } else {
      setError('Feil kode');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md mx-4"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">
            <span className="text-primary">Dotty</span>
            <span>.</span>
            <span className="text-muted-foreground ml-2">Admin</span>
          </h1>
        </div>

        <div className="bg-muted rounded-lg p-6">
          {step === 'password' ? (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Passord</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary pr-10"
                    placeholder="Skriv inn passord"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-error text-sm">{error}</p>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-background font-semibold rounded-lg hover:bg-primary-light transition-colors disabled:opacity-50"
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Logg inn
              </button>
            </form>
          ) : (
            <form onSubmit={handleTotpSubmit} className="space-y-4">
              <p className="text-sm text-muted-foreground mb-4">
                Skriv inn koden fra autentiseringsappen din
              </p>

              <div>
                <label className="block text-sm font-medium mb-1">Kode</label>
                <input
                  type="text"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  maxLength={6}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-center text-2xl tracking-widest font-mono"
                  placeholder="000000"
                  autoFocus
                />
              </div>

              {error && (
                <p className="text-error text-sm">{error}</p>
              )}

              <button
                type="submit"
                disabled={isLoading || totpCode.length !== 6}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-background font-semibold rounded-lg hover:bg-primary-light transition-colors disabled:opacity-50"
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Verifiser
              </button>

              <button
                type="button"
                onClick={() => setStep('password')}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Tilbake
              </button>
            </form>
          )}
        </div>

        <p className="text-xs text-muted-foreground text-center mt-4">
          Demo: passord = dotty2024, kode = 123456
        </p>
      </motion.div>
    </div>
  );
}
