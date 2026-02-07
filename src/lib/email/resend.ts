import { Resend } from 'resend';

export type Locale = 'no' | 'en';

let resendInstance: Resend | null = null;

export function getResend(): Resend {
  if (!resendInstance) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not set. Email sending will fail.');
    }
    resendInstance = new Resend(apiKey);
  }
  return resendInstance;
}

export const emailConfig = {
  from: 'Dotty <hei@dotty.no>',
  artistEmail: process.env.ARTIST_EMAIL || 'hei@dotty.no',
  internalEmail: 'dotty@dotty.no',
  baseUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://dotty.no',
  domains: {
    no: process.env.NEXT_PUBLIC_DOMAIN_NO || 'https://dotty.no',
    en: process.env.NEXT_PUBLIC_DOMAIN_EN || 'https://dottyartwork.com',
  },
} as const;

export function getEmailBaseUrl(locale: Locale = 'no'): string {
  return emailConfig.domains[locale];
}
