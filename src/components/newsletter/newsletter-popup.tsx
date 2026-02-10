'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Gift, Check, X, Copy } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Dictionary, Locale } from '@/types';
import { overlay } from '@/lib/animations';

const POPUP_KEY = 'dotty-newsletter-popup';
const COOKIE_CONSENT_KEY = 'dotty-cookie-consent';
const COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const SUPPRESSED_PATHS = ['/kasse', '/checkout', '/handlekurv', '/cart', '/unsubscribe'];
const SHOW_DELAY = 8000;
const SCROLL_THRESHOLD = 0.25;

interface NewsletterPopupProps {
  lang: Locale;
  dictionary: Dictionary;
}

type PopupState = 'form' | 'success' | 'already' | 'error';

export function NewsletterPopup({ lang, dictionary }: NewsletterPopupProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [state, setState] = useState<PopupState>('form');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const pathname = usePathname();
  const t = dictionary.newsletterPopup;

  useEffect(() => {
    setMounted(true);
  }, []);

  const shouldSuppress = useCallback(() => {
    if (SUPPRESSED_PATHS.some((p) => pathname.includes(p))) return true;

    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) return true;

    const stored = localStorage.getItem(POPUP_KEY);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        if (data.subscribed) return true;
        if (data.dismissed) {
          return Date.now() - data.timestamp < COOLDOWN_MS;
        }
      } catch { /* ignore */ }
    }

    return false;
  }, [pathname]);

  useEffect(() => {
    if (!mounted) return;
    if (shouldSuppress()) return;

    let triggered = false;
    let delayMet = false;
    let scrollMet = false;

    function tryShow() {
      if (triggered) return;
      if (delayMet && scrollMet) {
        triggered = true;
        setOpen(true);
      }
    }

    const timer = setTimeout(() => {
      delayMet = true;
      tryShow();
    }, SHOW_DELAY);

    function onScroll() {
      const scrolled = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
      if (scrolled >= SCROLL_THRESHOLD) {
        scrollMet = true;
        tryShow();
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', onScroll);
    };
  }, [mounted, shouldSuppress]);

  // Body scroll lock
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Focus input when form opens
  useEffect(() => {
    if (open && state === 'form') {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, state]);

  // Escape key
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') dismiss();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function dismiss() {
    setOpen(false);
    if (state === 'form') {
      localStorage.setItem(POPUP_KEY, JSON.stringify({ dismissed: true, timestamp: Date.now() }));
    }
  }

  function markSubscribed() {
    localStorage.setItem(POPUP_KEY, JSON.stringify({ subscribed: true }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || loading) return;

    setLoading(true);
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        markSubscribed();
        setState('success');
      } else if (res.status === 409 || data?.error?.includes('already')) {
        markSubscribed();
        setState('already');
      } else {
        setState('error');
      }
    } catch {
      setState('error');
    } finally {
      setLoading(false);
    }
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText('VELKOMST10');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  }

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            variants={overlay}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            onClick={dismiss}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={t.title}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[65] flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="relative bg-background border border-border shadow-2xl max-w-md w-[calc(100%-2rem)] max-h-[90dvh] overflow-y-auto pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={dismiss}
                className="absolute top-3 right-3 p-2 text-muted-foreground hover:text-foreground active:text-foreground transition-colors touch-manipulation z-10"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="p-6 sm:p-8">
                {state === 'form' && (
                  <>
                    <div className="flex justify-center mb-4">
                      <div className="w-14 h-14 bg-primary/10 flex items-center justify-center">
                        <Gift className="w-7 h-7 text-primary" />
                      </div>
                    </div>
                    <h2 className="text-2xl font-bold text-center mb-2">{t.title}</h2>
                    <p className="text-muted-foreground text-center mb-6">{t.subtitle}</p>

                    <form onSubmit={handleSubmit} className="space-y-3">
                      <input
                        ref={inputRef}
                        type="email"
                        inputMode="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={t.placeholder}
                        required
                        className="w-full px-4 py-3.5 bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                      />
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 bg-primary text-background font-bold text-sm uppercase tracking-wider hover:bg-primary-light active:bg-primary-light transition-colors touch-manipulation disabled:opacity-60"
                      >
                        {loading ? '...' : t.subscribe}
                      </button>
                    </form>

                    <p className="text-xs text-muted-foreground text-center mt-4">
                      {t.privacyNotice}{' '}
                      <Link href={`/${lang}/privacy`} className="text-primary hover:underline">
                        {t.privacyLink}
                      </Link>
                    </p>
                  </>
                )}

                {(state === 'success' || state === 'already') && (
                  <>
                    <div className="flex justify-center mb-4">
                      <div className="w-14 h-14 bg-green-500/10 flex items-center justify-center">
                        <Check className="w-7 h-7 text-green-500" />
                      </div>
                    </div>
                    <h2 className="text-2xl font-bold text-center mb-2">
                      {state === 'already' ? t.alreadyTitle : t.successTitle}
                    </h2>
                    <p className="text-muted-foreground text-center mb-6">
                      {state === 'already' ? t.alreadyMessage : t.successMessage}
                    </p>

                    <div className="bg-muted border border-border p-4 flex items-center justify-between gap-3 mb-4">
                      <span className="font-mono text-lg font-bold text-primary tracking-wider">
                        {t.successCode}
                      </span>
                      <button
                        onClick={copyCode}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium border border-border hover:border-primary hover:text-primary active:border-primary active:text-primary transition-colors touch-manipulation"
                      >
                        <Copy className="w-4 h-4" />
                        {copied ? t.copied : t.copyCode}
                      </button>
                    </div>

                    <Link
                      href={`/${lang}/shop`}
                      onClick={dismiss}
                      className="block w-full py-3.5 bg-primary text-background font-bold text-sm uppercase tracking-wider text-center hover:bg-primary-light active:bg-primary-light transition-colors touch-manipulation"
                    >
                      {t.browseShop}
                    </Link>
                  </>
                )}

                {state === 'error' && (
                  <>
                    <div className="flex justify-center mb-4">
                      <div className="w-14 h-14 bg-primary/10 flex items-center justify-center">
                        <Gift className="w-7 h-7 text-primary" />
                      </div>
                    </div>
                    <h2 className="text-2xl font-bold text-center mb-2">{t.title}</h2>
                    <p className="text-red-400 text-center mb-4">{t.error}</p>
                    <button
                      onClick={() => setState('form')}
                      className="w-full py-3.5 bg-primary text-background font-bold text-sm uppercase tracking-wider hover:bg-primary-light active:bg-primary-light transition-colors touch-manipulation"
                    >
                      {t.subscribe}
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
