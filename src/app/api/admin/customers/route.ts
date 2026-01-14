import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyAdminAuth } from '@/lib/auth/admin-guard';
import { getResend, emailConfig } from '@/lib/email/resend';
import { NewsletterEmail } from '@/emails/newsletter';
import { logAudit, getAuditHeadersFromRequest } from '@/lib/audit';

export const dynamic = 'force-dynamic';

interface CustomerEmail {
  email: string;
  source: 'newsletter' | 'order';
  name?: string;
  is_confirmed?: boolean;
}

export async function GET(): Promise<NextResponse> {
  const auth = await verifyAdminAuth();
  if (!auth.authorized) return auth.response;

  const supabase = createAdminClient();

  const [subscribersResult, ordersResult] = await Promise.all([
    supabase
      .from('newsletter_subscribers')
      .select('email, subscribed_at, is_confirmed')
      .is('unsubscribed_at', null)
      .order('subscribed_at', { ascending: false }),
    supabase
      .from('orders')
      .select('customer_email, customer_name')
      .not('customer_email', 'is', null)
      .order('created_at', { ascending: false }),
  ]);

  if (subscribersResult.error) {
    console.error('Failed to fetch subscribers:', subscribersResult.error);
  }
  if (ordersResult.error) {
    console.error('Failed to fetch order customers:', ordersResult.error);
  }

  const subscribers = subscribersResult.data || [];
  const orderCustomers = ordersResult.data || [];
  const emailMap = new Map<string, CustomerEmail>();

  for (const sub of subscribers) {
    const email = sub.email.toLowerCase();
    if (!emailMap.has(email)) {
      emailMap.set(email, {
        email,
        source: 'newsletter',
        is_confirmed: sub.is_confirmed ?? false,
      });
    }
  }

  for (const order of orderCustomers) {
    const email = order.customer_email.toLowerCase();
    const existing = emailMap.get(email);
    if (!existing) {
      emailMap.set(email, {
        email,
        source: 'order',
        name: order.customer_name,
      });
    } else if (order.customer_name && !existing.name) {
      emailMap.set(email, { ...existing, name: order.customer_name });
    }
  }

  const customers = Array.from(emailMap.values());
  const newsletterOnlyCount = customers.filter(
    (c) => c.source === 'newsletter' && !orderCustomers.some((o) => o.customer_email.toLowerCase() === c.email)
  ).length;

  return NextResponse.json({
    customers,
    stats: {
      total: customers.length,
      newsletterOnly: newsletterOnlyCount,
      orderCustomers: orderCustomers.length,
    },
  });
}

export async function POST(request: Request): Promise<NextResponse> {
  const auth = await verifyAdminAuth();
  if (!auth.authorized) return auth.response;

  const body = await request.json();
  const { subject, content, testEmail } = body;

  if (!subject || !content) {
    return NextResponse.json(
      { error: 'Subject and content are required' },
      { status: 400 }
    );
  }

  const resend = getResend();

  if (testEmail) {
    const { error } = await resend.emails.send({
      from: emailConfig.from,
      to: testEmail,
      subject: `[TEST] ${subject}`,
      react: NewsletterEmail({ subject, content, recipientEmail: testEmail }),
    });

    if (error) {
      console.error('Failed to send test email:', error);
      return NextResponse.json(
        { error: `Failed to send test email: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Test email sent to ${testEmail}`,
      sent: 1,
    });
  }

  const supabase = createAdminClient();

  const [subscribersResult, ordersResult] = await Promise.all([
    supabase.from('newsletter_subscribers').select('email').eq('is_active', true),
    supabase.from('orders').select('customer_email').not('customer_email', 'is', null),
  ]);

  const emailSet = new Set<string>();
  for (const sub of subscribersResult.data || []) {
    emailSet.add(sub.email.toLowerCase());
  }
  for (const order of ordersResult.data || []) {
    emailSet.add(order.customer_email.toLowerCase());
  }

  const emails = Array.from(emailSet);
  if (emails.length === 0) {
    return NextResponse.json({ error: 'No customers to send to' }, { status: 400 });
  }

  const batchSize = 10;
  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (let i = 0; i < emails.length; i += batchSize) {
    const batch = emails.slice(i, i + batchSize);

    const results = await Promise.allSettled(
      batch.map(async (email) => {
        const { error } = await resend.emails.send({
          from: emailConfig.from,
          to: email,
          subject,
          react: NewsletterEmail({ subject, content, recipientEmail: email }),
        });
        if (error) throw new Error(`${email}: ${error.message}`);
      })
    );

    for (const result of results) {
      if (result.status === 'fulfilled') {
        sent++;
      } else {
        failed++;
        errors.push(result.reason?.message || 'Unknown error');
      }
    }

    if (i + batchSize < emails.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  await logAudit({
    action: 'newsletter_sent',
    entity_type: 'newsletter',
    actor_type: 'admin',
    actor_id: auth.user.id,
    details: {
      subject,
      totalRecipients: emails.length,
      sent,
      failed,
    },
    ...getAuditHeadersFromRequest(request),
  });

  return NextResponse.json({
    success: true,
    message: `Newsletter sent to ${sent} customers`,
    sent,
    failed,
    errors: errors.slice(0, 5),
  });
}
