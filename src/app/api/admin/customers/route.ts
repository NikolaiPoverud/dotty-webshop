import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyAdminAuth } from '@/lib/auth/admin-guard';
import { getResend, emailConfig } from '@/lib/email/resend';
import { NewsletterEmail } from '@/emails/newsletter';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

interface CustomerEmail {
  email: string;
  source: 'newsletter' | 'order';
  name?: string;
  is_confirmed?: boolean;
}

// GET: Fetch all unique customer emails
export async function GET() {
  const auth = await verifyAdminAuth();
  if (!auth.authorized) return auth.response;

  try {
    const supabase = createAdminClient();

    // Get all newsletter subscribers (not unsubscribed)
    const { data: subscribers, error: subscribersError } = await supabase
      .from('newsletter_subscribers')
      .select('email, created_at, is_confirmed')
      .is('unsubscribed_at', null)
      .order('created_at', { ascending: false });

    if (subscribersError) {
      console.error('Failed to fetch subscribers:', subscribersError);
    }

    // Get unique customer emails from orders
    const { data: orderCustomers, error: ordersError } = await supabase
      .from('orders')
      .select('customer_email, customer_name')
      .not('customer_email', 'is', null)
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.error('Failed to fetch order customers:', ordersError);
    }

    // Combine and deduplicate
    const emailMap = new Map<string, CustomerEmail>();

    // Add newsletter subscribers
    (subscribers || []).forEach((sub) => {
      const email = sub.email.toLowerCase();
      if (!emailMap.has(email)) {
        emailMap.set(email, {
          email,
          source: 'newsletter',
          is_confirmed: sub.is_confirmed ?? false,
        });
      }
    });

    // Add order customers (might override newsletter if they also ordered)
    (orderCustomers || []).forEach((order) => {
      const email = order.customer_email.toLowerCase();
      const existing = emailMap.get(email);
      if (!existing) {
        emailMap.set(email, {
          email,
          source: 'order',
          name: order.customer_name,
        });
      } else if (order.customer_name && !existing.name) {
        // Add name if we have it
        emailMap.set(email, { ...existing, name: order.customer_name });
      }
    });

    const customers = Array.from(emailMap.values());

    return NextResponse.json({
      customers,
      stats: {
        total: customers.length,
        newsletterOnly: customers.filter(c => c.source === 'newsletter' && !orderCustomers?.some(o => o.customer_email.toLowerCase() === c.email)).length,
        orderCustomers: (orderCustomers || []).length,
      },
    });
  } catch (error) {
    console.error('Failed to fetch customers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}

// POST: Send bulk email to all customers
export async function POST(request: Request) {
  const auth = await verifyAdminAuth();
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json();
    const { subject, content, testEmail } = body;

    if (!subject || !content) {
      return NextResponse.json(
        { error: 'Subject and content are required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const resend = getResend();

    // If test email provided, only send to that address
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

    // Get all customer emails
    const { data: subscribers } = await supabase
      .from('newsletter_subscribers')
      .select('email')
      .eq('is_active', true);

    const { data: orderCustomers } = await supabase
      .from('orders')
      .select('customer_email')
      .not('customer_email', 'is', null);

    // Deduplicate emails
    const emailSet = new Set<string>();
    (subscribers || []).forEach((sub) => emailSet.add(sub.email.toLowerCase()));
    (orderCustomers || []).forEach((order) => emailSet.add(order.customer_email.toLowerCase()));

    const emails = Array.from(emailSet);

    if (emails.length === 0) {
      return NextResponse.json(
        { error: 'No customers to send to' },
        { status: 400 }
      );
    }

    // Send emails in batches (Resend has rate limits)
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

          if (error) {
            throw new Error(`${email}: ${error.message}`);
          }
        })
      );

      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          sent++;
        } else {
          failed++;
          errors.push(result.reason?.message || 'Unknown error');
        }
      });

      // Small delay between batches to respect rate limits
      if (i + batchSize < emails.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    // Log the action
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
    });

    return NextResponse.json({
      success: true,
      message: `Newsletter sent to ${sent} customers`,
      sent,
      failed,
      errors: errors.slice(0, 5), // Only return first 5 errors
    });
  } catch (error) {
    console.error('Failed to send newsletter:', error);
    return NextResponse.json(
      { error: 'Failed to send newsletter' },
      { status: 500 }
    );
  }
}
