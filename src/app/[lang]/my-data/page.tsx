'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Download, Trash2, Mail, CheckCircle, AlertCircle, Loader2, Shield } from 'lucide-react';
import Link from 'next/link';
import type { Locale } from '@/types';

const text = {
  no: {
    title: 'Mine data',
    subtitle: 'I henhold til GDPR har du rett til å se, eksportere og slette dine personlige data.',
    emailLabel: 'E-postadresse',
    emailPlaceholder: 'Din e-postadresse',
    exportTitle: 'Eksporter data',
    exportDescription: 'Last ned all data vi har lagret om deg i JSON-format.',
    exportButton: 'Be om eksport',
    deleteTitle: 'Slett data',
    deleteDescription: 'Slett all din personlige informasjon fra våre systemer permanent.',
    deleteButton: 'Be om sletting',
    deleteWarning: 'Dette kan ikke angres. Ordrehistorikk anonymiseres for regnskapsformål.',
    sending: 'Sender...',
    successTitle: 'Sjekk e-posten din!',
    successMessage: 'Vi har sendt deg en bekreftelseslenke. Klikk på den for å fullføre forespørselen.',
    completedExportTitle: 'Eksport fullført!',
    completedExportMessage: 'Dine data har blitt sendt til e-postadressen din.',
    completedDeleteTitle: 'Sletting fullført!',
    completedDeleteMessage: 'All din personlige informasjon er slettet.',
    invalidTitle: 'Ugyldig lenke',
    invalidMessage: 'Bekreftelseslenken er ugyldig eller har utløpt.',
    errorTitle: 'Noe gikk galt',
    errorMessage: 'Vi kunne ikke behandle forespørselen. Prøv igjen.',
    backHome: 'Tilbake til forsiden',
    privacyInfo: 'Les vår personvernerklæring for mer informasjon.',
  },
  en: {
    title: 'My Data',
    subtitle: 'Under GDPR, you have the right to access, export, and delete your personal data.',
    emailLabel: 'Email address',
    emailPlaceholder: 'Your email address',
    exportTitle: 'Export data',
    exportDescription: 'Download all data we have stored about you in JSON format.',
    exportButton: 'Request export',
    deleteTitle: 'Delete data',
    deleteDescription: 'Permanently delete all your personal information from our systems.',
    deleteButton: 'Request deletion',
    deleteWarning: 'This cannot be undone. Order history is anonymized for accounting purposes.',
    sending: 'Sending...',
    successTitle: 'Check your email!',
    successMessage: "We've sent you a confirmation link. Click it to complete your request.",
    completedExportTitle: 'Export complete!',
    completedExportMessage: 'Your data has been sent to your email address.',
    completedDeleteTitle: 'Deletion complete!',
    completedDeleteMessage: 'All your personal information has been deleted.',
    invalidTitle: 'Invalid link',
    invalidMessage: 'The confirmation link is invalid or has expired.',
    errorTitle: 'Something went wrong',
    errorMessage: "We couldn't process your request. Please try again.",
    backHome: 'Back to home',
    privacyInfo: 'Read our privacy policy for more information.',
  },
};

type RequestStatus = 'idle' | 'loading' | 'success' | 'error';

export default function MyDataPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const [lang, setLang] = useState<Locale>('no');
  const [email, setEmail] = useState('');
  const [exportStatus, setExportStatus] = useState<RequestStatus>('idle');
  const [deleteStatus, setDeleteStatus] = useState<RequestStatus>('idle');
  const searchParams = useSearchParams();

  useEffect(() => {
    params.then(({ lang }) => setLang(lang as Locale));
  }, [params]);

  const t = text[lang];
  const status = searchParams.get('status');
  const type = searchParams.get('type');

  // Show status message if redirected from verification
  if (status) {
    const statusConfig: Record<string, { icon: typeof CheckCircle; iconClass: string; title: string; message: string }> = {
      completed: {
        icon: CheckCircle,
        iconClass: 'text-success',
        title: type === 'export' ? t.completedExportTitle : t.completedDeleteTitle,
        message: type === 'export' ? t.completedExportMessage : t.completedDeleteMessage,
      },
      invalid: {
        icon: AlertCircle,
        iconClass: 'text-warning',
        title: t.invalidTitle,
        message: t.invalidMessage,
      },
      error: {
        icon: AlertCircle,
        iconClass: 'text-error',
        title: t.errorTitle,
        message: t.errorMessage,
      },
    };

    const config = statusConfig[status] || statusConfig.error;
    const Icon = config.icon;

    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center"
        >
          <div className="bg-muted rounded-2xl p-8 sm:p-12">
            <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-6 ${
              status === 'completed' ? 'bg-success/10' : 'bg-error/10'
            }`}>
              <Icon className={`w-8 h-8 ${config.iconClass}`} />
            </div>

            <h1 className="text-2xl font-bold mb-3">{config.title}</h1>
            <p className="text-muted-foreground mb-8">{config.message}</p>

            <Link
              href={`/${lang}`}
              className="inline-block px-6 py-3 bg-primary text-background font-medium rounded-lg hover:bg-primary-light transition-colors"
            >
              {t.backHome}
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  const handleRequest = async (requestType: 'export' | 'delete') => {
    if (!email || !email.includes('@')) return;

    const setStatus = requestType === 'export' ? setExportStatus : setDeleteStatus;
    setStatus('loading');

    try {
      const response = await fetch('/api/gdpr/data-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, request_type: requestType }),
      });

      if (!response.ok) {
        throw new Error('Failed to create request');
      }

      setStatus('success');
    } catch {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  return (
    <div className="min-h-[60vh] py-20 px-4">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">{t.title}</h1>
          <p className="text-muted-foreground">{t.subtitle}</p>
        </motion.div>

        {/* Email Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <label className="block text-sm font-medium mb-2">{t.emailLabel}</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t.emailPlaceholder}
            className="w-full px-4 py-3 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </motion.div>

        <div className="space-y-6">
          {/* Export Data */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-muted rounded-xl p-6"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Download className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold mb-2">{t.exportTitle}</h2>
                <p className="text-muted-foreground text-sm mb-4">{t.exportDescription}</p>

                {exportStatus === 'success' ? (
                  <div className="flex items-center gap-2 text-success">
                    <Mail className="w-5 h-5" />
                    <span>{t.successMessage}</span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleRequest('export')}
                    disabled={!email || exportStatus === 'loading'}
                    className="px-4 py-2 bg-primary text-background font-medium rounded-lg hover:bg-primary-light transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {exportStatus === 'loading' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {t.sending}
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        {t.exportButton}
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </motion.div>

          {/* Delete Data */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-muted rounded-xl p-6 border border-error/20"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-error/10 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-6 h-6 text-error" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold mb-2">{t.deleteTitle}</h2>
                <p className="text-muted-foreground text-sm mb-2">{t.deleteDescription}</p>
                <p className="text-warning text-xs mb-4">{t.deleteWarning}</p>

                {deleteStatus === 'success' ? (
                  <div className="flex items-center gap-2 text-success">
                    <Mail className="w-5 h-5" />
                    <span>{t.successMessage}</span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleRequest('delete')}
                    disabled={!email || deleteStatus === 'loading'}
                    className="px-4 py-2 bg-error/10 text-error font-medium rounded-lg hover:bg-error/20 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {deleteStatus === 'loading' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {t.sending}
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        {t.deleteButton}
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Privacy Link */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center text-sm text-muted-foreground mt-8"
        >
          <Link href={`/${lang}/privacy`} className="hover:text-primary transition-colors">
            {t.privacyInfo}
          </Link>
        </motion.p>
      </div>
    </div>
  );
}
