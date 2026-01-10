'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { MailX, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import type { Locale } from '@/types';

const text = {
  no: {
    title: 'Avmelding',
    processing: 'Behandler avmelding...',
    success: 'Du er nå avmeldt',
    successMessage: 'Du vil ikke lenger motta nyhetsbrev fra oss. Vi er lei oss for å se deg gå!',
    alreadyUnsubscribed: 'Du er allerede avmeldt',
    alreadyMessage: 'Denne e-postadressen er ikke lenger på vår liste.',
    error: 'Noe gikk galt',
    errorMessage: 'Vi kunne ikke behandle avmeldingen. Prøv igjen eller kontakt oss.',
    invalidLink: 'Ugyldig lenke',
    invalidMessage: 'Avmeldingslenken er ugyldig eller utløpt.',
    backHome: 'Tilbake til forsiden',
    resubscribe: 'Abonner igjen',
  },
  en: {
    title: 'Unsubscribe',
    processing: 'Processing unsubscription...',
    success: "You've been unsubscribed",
    successMessage: "You won't receive any more newsletters from us. We're sorry to see you go!",
    alreadyUnsubscribed: 'Already unsubscribed',
    alreadyMessage: 'This email address is no longer on our list.',
    error: 'Something went wrong',
    errorMessage: "We couldn't process your unsubscription. Please try again or contact us.",
    invalidLink: 'Invalid link',
    invalidMessage: 'The unsubscribe link is invalid or has expired.',
    backHome: 'Back to home',
    resubscribe: 'Subscribe again',
  },
};

type Status = 'loading' | 'success' | 'already' | 'error' | 'invalid';

export default function UnsubscribePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const [lang, setLang] = useState<Locale>('no');
  const [status, setStatus] = useState<Status>('loading');
  const searchParams = useSearchParams();

  useEffect(() => {
    params.then(({ lang }) => setLang(lang as Locale));
  }, [params]);

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('invalid');
      return;
    }

    // Process unsubscription
    fetch(`/api/newsletter/unsubscribe?token=${token}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          if (data.error.includes('Invalid')) {
            setStatus('invalid');
          } else {
            setStatus('error');
          }
        } else if (data.already_unsubscribed) {
          setStatus('already');
        } else {
          setStatus('success');
        }
      })
      .catch(() => {
        setStatus('error');
      });
  }, [searchParams]);

  const t = text[lang];

  const statusConfig = {
    loading: {
      icon: Loader2,
      iconClass: 'animate-spin text-primary',
      bgClass: 'bg-primary/10',
      title: t.processing,
      message: '',
    },
    success: {
      icon: CheckCircle,
      iconClass: 'text-success',
      bgClass: 'bg-success/10',
      title: t.success,
      message: t.successMessage,
    },
    already: {
      icon: MailX,
      iconClass: 'text-muted-foreground',
      bgClass: 'bg-primary/10',
      title: t.alreadyUnsubscribed,
      message: t.alreadyMessage,
    },
    error: {
      icon: XCircle,
      iconClass: 'text-error',
      bgClass: 'bg-error/10',
      title: t.error,
      message: t.errorMessage,
    },
    invalid: {
      icon: XCircle,
      iconClass: 'text-warning',
      bgClass: 'bg-error/10',
      title: t.invalidLink,
      message: t.invalidMessage,
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center"
      >
        <div className="bg-muted rounded-2xl p-8 sm:p-12">
          <div
            className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-6 ${config.bgClass}`}
          >
            <Icon className={`w-8 h-8 ${config.iconClass}`} />
          </div>

          <h1 className="text-2xl font-bold mb-3">{config.title}</h1>

          {config.message && (
            <p className="text-muted-foreground mb-8">{config.message}</p>
          )}

          {status !== 'loading' && (
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href={`/${lang}`}
                className="px-6 py-3 bg-primary text-background font-medium rounded-lg hover:bg-primary-light transition-colors"
              >
                {t.backHome}
              </Link>
              {(status === 'success' || status === 'already') && (
                <Link
                  href={`/${lang}#newsletter`}
                  className="px-6 py-3 border border-border text-foreground font-medium rounded-lg hover:bg-muted transition-colors"
                >
                  {t.resubscribe}
                </Link>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
