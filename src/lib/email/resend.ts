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
  // Use Resend test mode sender for now
  from: 'Dotty <onboarding@resend.dev>',
  // Artist email for order notifications
  artistEmail: process.env.ARTIST_EMAIL || 'hei@dotty.no',
  // Base URL for links in emails
  baseUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://dotty.art',
};
