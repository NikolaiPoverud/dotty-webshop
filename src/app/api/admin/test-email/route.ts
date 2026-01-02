import { NextRequest, NextResponse } from 'next/server';
import { getResend, emailConfig } from '@/lib/email/resend';
import {
  testEmailTemplate,
  orderConfirmationTemplate,
  shippingNotificationTemplate,
  newsletterConfirmationTemplate,
} from '@/lib/email/templates';
import { verifyAdminAuth } from '@/lib/auth/admin-guard';

// Sample data for email previews
const sampleOrderData = {
  orderNumber: 'TEST-12345',
  customerName: 'Test Kunde',
  items: [
    { title: 'Neon Dreams - Original', quantity: 1, price: 450000 },
    { title: 'Pink Explosion - Print A3', quantity: 2, price: 85000 },
  ],
  subtotal: 620000,
  discount: 50000,
  shipping: 0,
  total: 570000,
  shippingAddress: {
    line1: 'Testgata 123',
    line2: 'Leilighet 4B',
    city: 'Oslo',
    postal_code: '0123',
    country: 'Norge',
  },
};

const sampleShippingData = {
  orderNumber: 'TEST-12345',
  customerName: 'Test Kunde',
  trackingNumber: 'NO123456789',
  trackingUrl: 'https://tracking.posten.no/NO123456789',
  carrier: 'Posten',
};

export type EmailType = 'test' | 'order-confirmation' | 'shipping-notification' | 'newsletter-confirmation';

const emailTypes: Record<EmailType, { label: string; subject: string }> = {
  'test': { label: 'Test E-post', subject: 'Test E-post fra Dotty' },
  'order-confirmation': { label: 'Ordrebekreftelse', subject: 'Ordrebekreftelse #TEST-12345' },
  'shipping-notification': { label: 'Sendingsvarsel', subject: 'Din ordre #TEST-12345 er sendt!' },
  'newsletter-confirmation': { label: 'Nyhetsbrev-bekreftelse', subject: 'Bekreft nyhetsbrev-abonnement' },
};

function getEmailTemplate(type: EmailType): string {
  switch (type) {
    case 'test':
      return testEmailTemplate();
    case 'order-confirmation':
      return orderConfirmationTemplate(sampleOrderData);
    case 'shipping-notification':
      return shippingNotificationTemplate(sampleShippingData);
    case 'newsletter-confirmation':
      return newsletterConfirmationTemplate('https://dotty.no/newsletter/confirm?token=test123');
    default:
      return testEmailTemplate();
  }
}

export async function POST(request: NextRequest) {
  const auth = await verifyAdminAuth();
  if (!auth.authorized) return auth.response;

  try {
    const { email, type = 'test' } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      );
    }

    const emailType = type as EmailType;
    const typeConfig = emailTypes[emailType] || emailTypes['test'];

    const resend = getResend();

    const { data, error } = await resend.emails.send({
      from: emailConfig.from,
      to: email,
      subject: typeConfig.subject,
      html: getEmailTemplate(emailType),
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: data?.id,
      type: emailType,
      label: typeConfig.label,
    });
  } catch (error) {
    console.error('Test email error:', error);
    const message = error instanceof Error ? error.message : 'Failed to send test email';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

// GET endpoint to list available email types
export async function GET() {
  const auth = await verifyAdminAuth();
  if (!auth.authorized) return auth.response;

  return NextResponse.json({
    types: Object.entries(emailTypes).map(([key, value]) => ({
      id: key,
      label: value.label,
      subject: value.subject,
    })),
  });
}
