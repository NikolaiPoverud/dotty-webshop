import { NextRequest, NextResponse } from 'next/server';
import { getResend, emailConfig } from '@/lib/email/resend';

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
      subject: 'Test Email fra Dotty',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #ec4899; margin-bottom: 20px;">Dotty Test Email</h1>
          <p style="color: #333; font-size: 16px; line-height: 1.6;">
            Dette er en test-epost fra Dotty admin panel.
          </p>
          <p style="color: #333; font-size: 16px; line-height: 1.6;">
            Hvis du mottar denne e-posten, fungerer e-postsystemet korrekt!
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
          <p style="color: #666; font-size: 14px;">
            Sendt fra ${emailConfig.baseUrl}
          </p>
        </div>
      `,
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
