'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import type { Locale } from '@/types';

const text = {
  no: {
    success: 'Abonnement bekreftet!',
    successMessage: 'Du er nå påmeldt nyhetsbrevet. Vi gleder oss til å dele nye kunstverk, tilbud og nyheter med deg!',
    already: 'Allerede bekreftet',
    alreadyMessage: 'E-postadressen din er allerede bekreftet og aktiv.',
    invalid: 'Ugyldig lenke',
    invalidMessage: 'Bekreftelseslenken er ugyldig eller har utløpt. Prøv å abonnere på nytt.',
    unsubscribed: 'Avmeldt',
    unsubscribedMessage: 'Denne e-postadressen er avmeldt. Du kan abonnere på nytt hvis du ønsker.',
    error: 'Noe gikk galt',
    errorMessage: 'Vi kunne ikke bekrefte abonnementet. Prøv igjen senere.',
    backHome: 'Tilbake til forsiden',
    browseArt: 'Se kunsten',
  },
  en: {
    success: 'Subscription confirmed!',
    successMessage: "You're now subscribed to the newsletter. We're excited to share new artworks, offers, and news with you!",
    already: 'Already confirmed',
    alreadyMessage: 'Your email address is already confirmed and active.',
    invalid: 'Invalid link',
    invalidMessage: 'The confirmation link is invalid or has expired. Please try subscribing again.',
    unsubscribed: 'Unsubscribed',
    unsubscribedMessage: 'This email address is unsubscribed. You can subscribe again if you wish.',
    error: 'Something went wrong',
    errorMessage: "We couldn't confirm your subscription. Please try again later.",
    backHome: 'Back to home',
    browseArt: 'Browse art',
  },
};

type Status = 'success' | 'already' | 'invalid' | 'unsubscribed' | 'error';

export default function NewsletterConfirmedPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const [lang, setLang] = useState<Locale>('no');
  const searchParams = useSearchParams();
  const status = (searchParams.get('status') as Status) || 'error';

  useEffect(() => {
    params.then(({ lang }) => setLang(lang as Locale));
  }, [params]);

  const t = text[lang];

  const statusConfig = {
    success: {
      icon: CheckCircle,
      iconClass: 'text-success',
      bgClass: 'bg-success/10',
      title: t.success,
      message: t.successMessage,
    },
    already: {
      icon: Mail,
      iconClass: 'text-primary',
      bgClass: 'bg-primary/10',
      title: t.already,
      message: t.alreadyMessage,
    },
    invalid: {
      icon: XCircle,
      iconClass: 'text-warning',
      bgClass: 'bg-warning/10',
      title: t.invalid,
      message: t.invalidMessage,
    },
    unsubscribed: {
      icon: AlertCircle,
      iconClass: 'text-muted-foreground',
      bgClass: 'bg-muted',
      title: t.unsubscribed,
      message: t.unsubscribedMessage,
    },
    error: {
      icon: XCircle,
      iconClass: 'text-error',
      bgClass: 'bg-error/10',
      title: t.error,
      message: t.errorMessage,
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
          <p className="text-muted-foreground mb-8">{config.message}</p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href={`/${lang}`}
              className="px-6 py-3 bg-primary text-background font-medium rounded-lg hover:bg-primary-light transition-colors"
            >
              {t.backHome}
            </Link>
            <Link
              href={`/${lang}/shop`}
              className="px-6 py-3 border border-border text-foreground font-medium rounded-lg hover:bg-background transition-colors"
            >
              {t.browseArt}
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
