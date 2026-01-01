import { NextRequest, NextResponse } from 'next/server';
import { getResend, emailConfig } from '@/lib/email/resend';
import { testEmailTemplate } from '@/lib/email/templates';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      );
    }

    const resend = getResend();

    const { data, error } = await resend.emails.send({
      from: emailConfig.from,
      to: email,
      subject: 'Test E-post fra Dotty',
      html: testEmailTemplate(),
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
