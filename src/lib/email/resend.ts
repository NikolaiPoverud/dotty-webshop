import { Resend } from 'resend';

// Lazy initialization to avoid build errors when API key is not set
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

// Email configuration
export const emailConfig = {
  // Use Resend verified sender (update when domain is verified)
  from: process.env.RESEND_FROM_EMAIL
    ? `Dotty <${process.env.RESEND_FROM_EMAIL}>`
    : 'Dotty <onboarding@resend.dev>',
  // Artist email for order notifications
  artistEmail: process.env.ARTIST_EMAIL || 'hei@dotty.no',
  // Base URLs for links in emails
  baseUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://dotty.no',
  // Domain-specific URLs
  domains: {
    no: process.env.NEXT_PUBLIC_DOMAIN_NO || 'https://dotty.no',
    en: process.env.NEXT_PUBLIC_DOMAIN_EN || 'https://dottyartwork.com',
  },
};

/**
 * Get the base URL for a specific locale
 */
export function getEmailBaseUrl(locale: 'no' | 'en' = 'no'): string {
  return emailConfig.domains[locale];
}
