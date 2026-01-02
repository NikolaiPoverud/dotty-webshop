// Dotty Brand Colors - Matching Website Design System
const colors = {
  background: '#131316',
  foreground: '#fafafa',
  primary: '#FE206A',
  primaryLight: '#FF4D8A',
  primaryDark: '#E01A5E',
  accent: '#a855f7',
  muted: '#27272a',
  mutedForeground: '#a1a1aa',
  border: '#3f3f46',
  card: '#1a1a1f',
  success: '#22c55e',
  error: '#ef4444',
};

// Base email wrapper with Dotty branding - Premium dark theme
function emailWrapper(content: string, previewText?: string): string {
  return `
<!DOCTYPE html>
<html lang="no">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Dotty</title>
  ${previewText ? `<!--[if !mso]><!--><meta name="x-apple-disable-message-reformatting"><!--<![endif]--><div style="display:none;font-size:1px;color:${colors.background};line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${previewText}</div>` : ''}
  <style>
    body { margin: 0; padding: 0; background-color: ${colors.background}; }
    table { border-spacing: 0; }
    td { padding: 0; }
    img { border: 0; }
    @media screen and (max-width: 600px) {
      .container { width: 100% !important; }
      .content { padding: 24px 16px !important; }
      .header { padding: 24px 16px !important; }
      .footer { padding: 16px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: ${colors.background}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: ${colors.background};">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" class="container" width="600" cellspacing="0" cellpadding="0" style="background-color: ${colors.card}; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);">
          <!-- Header with Logo -->
          <tr>
            <td class="header" style="padding: 32px 40px; text-align: center; background: linear-gradient(135deg, ${colors.card} 0%, ${colors.muted} 100%);">
              <h1 style="margin: 0; font-size: 36px; font-weight: 800; letter-spacing: -1px;">
                <span style="color: ${colors.primary};">Dotty</span><span style="color: ${colors.foreground};">.</span>
              </h1>
              <p style="margin: 8px 0 0 0; font-size: 12px; color: ${colors.mutedForeground}; text-transform: uppercase; letter-spacing: 2px;">
                Pop-Art for Alle
              </p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td class="content" style="padding: 40px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="footer" style="padding: 24px 40px; text-align: center; background-color: ${colors.muted};">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="text-align: center;">
                    <p style="margin: 0 0 8px 0; font-size: 11px; color: ${colors.mutedForeground};">
                      <a href="https://dotty.no" style="color: ${colors.primary}; text-decoration: none; font-weight: 600;">dotty.no</a>
                    </p>
                    <p style="margin: 0; font-size: 11px; color: ${colors.mutedForeground};">
                      Kontakt: <a href="mailto:hei@dotty.no" style="color: ${colors.mutedForeground}; text-decoration: underline;">hei@dotty.no</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- Legal Footer -->
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" class="container">
          <tr>
            <td style="padding: 20px 40px; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: ${colors.mutedForeground}; line-height: 1.5;">
                Du mottar denne e-posten fordi du har handlet hos Dotty eller registrert deg for nyhetsbrev.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// Primary button style - Rounded, bold, on-brand
function button(text: string, url: string): string {
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 24px auto;">
      <tr>
        <td style="background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%); border-radius: 50px; text-align: center; box-shadow: 0 4px 16px rgba(254, 32, 106, 0.3);">
          <a href="${url}" style="display: inline-block; padding: 16px 40px; font-size: 14px; font-weight: 700; color: ${colors.foreground}; text-decoration: none; text-transform: uppercase; letter-spacing: 1px;">
            ${text}
          </a>
        </td>
      </tr>
    </table>
  `;
}

// Divider
function divider(): string {
  return `<hr style="border: none; border-top: 1px solid ${colors.border}; margin: 28px 0;">`;
}

// Info box
function infoBox(content: string): string {
  return `
    <div style="background-color: ${colors.muted}; border-radius: 12px; padding: 20px; margin: 20px 0; border-left: 4px solid ${colors.primary};">
      ${content}
    </div>
  `;
}

// ============================================
// EMAIL TEMPLATES
// ============================================

export function testEmailTemplate(): string {
  const content = `
    <div style="text-align: center;">
      <!-- Success Icon -->
      <div style="width: 72px; height: 72px; margin: 0 auto 24px; background: linear-gradient(135deg, ${colors.success}20 0%, ${colors.success}10 100%); border-radius: 50%; display: table-cell; vertical-align: middle; text-align: center;">
        <span style="font-size: 36px; color: ${colors.success};">&#10003;</span>
      </div>

      <h2 style="margin: 0 0 16px 0; font-size: 26px; font-weight: 700; color: ${colors.foreground};">
        Test E-post
      </h2>

      <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.7; color: ${colors.mutedForeground};">
        Dette er en test-epost fra Dotty admin panel. Hvis du ser denne meldingen, fungerer e-postsystemet korrekt!
      </p>

      ${divider()}

      <p style="margin: 0; font-size: 13px; color: ${colors.mutedForeground};">
        Sendt fra admin dashboard
      </p>
    </div>
  `;

  return emailWrapper(content, 'Test e-post fra Dotty');
}

interface OrderItem {
  title: string;
  quantity: number;
  price: number;
}

interface OrderConfirmationData {
  orderNumber: string;
  customerName: string;
  items: OrderItem[];
  subtotal: number;
  discount?: number;
  shipping?: number;
  total: number;
  shippingAddress: {
    line1: string;
    line2?: string;
    city: string;
    postal_code: string;
    country: string;
  };
}

export function orderConfirmationTemplate(data: OrderConfirmationData): string {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('nb-NO', {
      style: 'currency',
      currency: 'NOK',
      minimumFractionDigits: 0,
    }).format(price / 100);
  };

  const itemsHtml = data.items.map(item => `
    <tr>
      <td style="padding: 16px 0; border-bottom: 1px solid ${colors.border};">
        <p style="margin: 0; font-size: 15px; color: ${colors.foreground}; font-weight: 600;">
          ${item.title}
        </p>
        <p style="margin: 6px 0 0 0; font-size: 13px; color: ${colors.mutedForeground};">
          Antall: ${item.quantity}
        </p>
      </td>
      <td style="padding: 16px 0; border-bottom: 1px solid ${colors.border}; text-align: right; vertical-align: top;">
        <p style="margin: 0; font-size: 15px; color: ${colors.foreground}; font-weight: 600;">
          ${formatPrice(item.price * item.quantity)}
        </p>
      </td>
    </tr>
  `).join('');

  const content = `
    <!-- Success Header -->
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="width: 80px; height: 80px; margin: 0 auto 24px; background: linear-gradient(135deg, ${colors.success}25 0%, ${colors.success}10 100%); border-radius: 50%; line-height: 80px;">
        <span style="font-size: 40px; color: ${colors.success};">&#10003;</span>
      </div>

      <h2 style="margin: 0 0 12px 0; font-size: 28px; font-weight: 700; color: ${colors.foreground};">
        Takk for din bestilling!
      </h2>

      <p style="margin: 0; font-size: 16px; color: ${colors.mutedForeground};">
        Hei ${data.customerName}, vi har mottatt din ordre.
      </p>
    </div>

    <!-- Order Number Box -->
    ${infoBox(`
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="text-align: center;">
            <p style="margin: 0 0 4px 0; font-size: 11px; color: ${colors.mutedForeground}; text-transform: uppercase; letter-spacing: 2px;">
              Ordrenummer
            </p>
            <p style="margin: 0; font-size: 28px; font-weight: 700; color: ${colors.primary}; font-family: 'SF Mono', Monaco, monospace;">
              ${data.orderNumber}
            </p>
          </td>
        </tr>
      </table>
    `)}

    ${divider()}

    <!-- Order Items -->
    <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 700; color: ${colors.foreground}; text-transform: uppercase; letter-spacing: 1px;">
      Din bestilling
    </h3>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
      ${itemsHtml}

      <!-- Subtotal -->
      <tr>
        <td style="padding: 16px 0 8px 0;">
          <p style="margin: 0; font-size: 14px; color: ${colors.mutedForeground};">Delsum</p>
        </td>
        <td style="padding: 16px 0 8px 0; text-align: right;">
          <p style="margin: 0; font-size: 14px; color: ${colors.foreground};">${formatPrice(data.subtotal)}</p>
        </td>
      </tr>

      ${data.discount ? `
      <tr>
        <td style="padding: 4px 0;">
          <p style="margin: 0; font-size: 14px; color: ${colors.success};">Rabatt</p>
        </td>
        <td style="padding: 4px 0; text-align: right;">
          <p style="margin: 0; font-size: 14px; color: ${colors.success};">-${formatPrice(data.discount)}</p>
        </td>
      </tr>
      ` : ''}

      ${data.shipping !== undefined ? `
      <tr>
        <td style="padding: 4px 0;">
          <p style="margin: 0; font-size: 14px; color: ${colors.mutedForeground};">Frakt</p>
        </td>
        <td style="padding: 4px 0; text-align: right;">
          <p style="margin: 0; font-size: 14px; color: ${colors.foreground};">${data.shipping === 0 ? 'Gratis' : formatPrice(data.shipping)}</p>
        </td>
      </tr>
      ` : ''}

      <!-- Total -->
      <tr>
        <td style="padding: 20px 0 0 0; border-top: 2px solid ${colors.border};">
          <p style="margin: 0; font-size: 18px; font-weight: 700; color: ${colors.foreground};">Totalt</p>
        </td>
        <td style="padding: 20px 0 0 0; border-top: 2px solid ${colors.border}; text-align: right;">
          <p style="margin: 0; font-size: 24px; font-weight: 700; color: ${colors.primary};">${formatPrice(data.total)}</p>
        </td>
      </tr>
    </table>

    ${divider()}

    <!-- Shipping Address -->
    <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 700; color: ${colors.foreground}; text-transform: uppercase; letter-spacing: 1px;">
      Leveringsadresse
    </h3>

    ${infoBox(`
      <p style="margin: 0; font-size: 14px; line-height: 1.7; color: ${colors.foreground};">
        <strong>${data.customerName}</strong><br>
        <span style="color: ${colors.mutedForeground};">
          ${data.shippingAddress.line1}<br>
          ${data.shippingAddress.line2 ? data.shippingAddress.line2 + '<br>' : ''}
          ${data.shippingAddress.postal_code} ${data.shippingAddress.city}<br>
          ${data.shippingAddress.country}
        </span>
      </p>
    `)}

    ${divider()}

    <p style="margin: 0; font-size: 14px; line-height: 1.7; color: ${colors.mutedForeground}; text-align: center;">
      Vi kontakter deg snart med informasjon om frakt.<br>
      Har du sporsmal? Svar pa denne e-posten.
    </p>
  `;

  return emailWrapper(content, `Ordrebekreftelse #${data.orderNumber}`);
}

interface ShippingData {
  orderNumber: string;
  customerName: string;
  trackingNumber?: string;
  trackingUrl?: string;
  carrier?: string;
}

export function shippingNotificationTemplate(data: ShippingData): string {
  const content = `
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="width: 80px; height: 80px; margin: 0 auto 24px; background: linear-gradient(135deg, ${colors.accent}25 0%, ${colors.accent}10 100%); border-radius: 50%; line-height: 80px;">
        <span style="font-size: 40px;">&#128230;</span>
      </div>

      <h2 style="margin: 0 0 12px 0; font-size: 28px; font-weight: 700; color: ${colors.foreground};">
        Din ordre er sendt!
      </h2>

      <p style="margin: 0; font-size: 16px; color: ${colors.mutedForeground};">
        Hei ${data.customerName}, din bestilling er pa vei til deg.
      </p>
    </div>

    <!-- Order Number -->
    ${infoBox(`
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="text-align: center;">
            <p style="margin: 0 0 4px 0; font-size: 11px; color: ${colors.mutedForeground}; text-transform: uppercase; letter-spacing: 2px;">
              Ordrenummer
            </p>
            <p style="margin: 0; font-size: 22px; font-weight: 700; color: ${colors.foreground}; font-family: 'SF Mono', Monaco, monospace;">
              ${data.orderNumber}
            </p>
          </td>
        </tr>
      </table>
    `)}

    ${data.trackingNumber ? `
    ${divider()}

    <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 700; color: ${colors.foreground}; text-transform: uppercase; letter-spacing: 1px;">
      Sporingsinformasjon
    </h3>

    ${infoBox(`
      ${data.carrier ? `<p style="margin: 0 0 12px 0; font-size: 14px; color: ${colors.mutedForeground};">Fraktselskap: <strong style="color: ${colors.foreground};">${data.carrier}</strong></p>` : ''}
      <p style="margin: 0; font-size: 14px; color: ${colors.mutedForeground};">
        Sporingsnummer: <strong style="color: ${colors.foreground}; font-family: 'SF Mono', Monaco, monospace;">${data.trackingNumber}</strong>
      </p>
    `)}

    ${data.trackingUrl ? `
    <div style="text-align: center;">
      ${button('Spor forsendelsen', data.trackingUrl)}
    </div>
    ` : ''}
    ` : ''}

    ${divider()}

    <p style="margin: 0; font-size: 14px; line-height: 1.7; color: ${colors.mutedForeground}; text-align: center;">
      Takk for at du handler hos Dotty!<br>
      Har du sporsmal? Svar pa denne e-posten.
    </p>
  `;

  return emailWrapper(content, `Din ordre #${data.orderNumber} er sendt!`);
}

// Bilingual email wrapper for newsletter/GDPR emails
export function bilingualEmailWrapper(contentNo: string, contentEn: string, previewText?: string): string {
  return `
<!DOCTYPE html>
<html lang="no">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Dotty</title>
  ${previewText ? `<!--[if !mso]><!--><meta name="x-apple-disable-message-reformatting"><!--<![endif]--><div style="display:none;font-size:1px;color:${colors.background};line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${previewText}</div>` : ''}
  <style>
    body { margin: 0; padding: 0; background-color: ${colors.background}; }
    table { border-spacing: 0; }
    td { padding: 0; }
    @media screen and (max-width: 600px) {
      .container { width: 100% !important; }
      .content { padding: 24px 16px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: ${colors.background}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: ${colors.background};">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" class="container" width="600" cellspacing="0" cellpadding="0" style="background-color: ${colors.card}; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);">
          <!-- Header with Logo -->
          <tr>
            <td style="padding: 32px 40px; text-align: center; background: linear-gradient(135deg, ${colors.card} 0%, ${colors.muted} 100%);">
              <h1 style="margin: 0; font-size: 36px; font-weight: 800; letter-spacing: -1px;">
                <span style="color: ${colors.primary};">Dotty</span><span style="color: ${colors.foreground};">.</span>
              </h1>
            </td>
          </tr>

          <!-- Norwegian Content -->
          <tr>
            <td class="content" style="padding: 40px;">
              ${contentNo}
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 0 40px;">
              <hr style="border: none; border-top: 1px solid ${colors.border}; margin: 0;">
            </td>
          </tr>

          <!-- English Content -->
          <tr>
            <td class="content" style="padding: 40px;">
              ${contentEn}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; text-align: center; background-color: ${colors.muted};">
              <p style="margin: 0; font-size: 11px; color: ${colors.mutedForeground};">
                <a href="https://dotty.no" style="color: ${colors.primary}; text-decoration: none; font-weight: 600;">dotty.no</a>
              </p>
            </td>
          </tr>
        </table>

        <!-- Disclaimer -->
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" class="container">
          <tr>
            <td style="padding: 20px 40px; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: ${colors.mutedForeground}; line-height: 1.5;">
                Hvis du ikke ba om dette, kan du ignorere denne e-posten.<br>
                If you didn't request this, you can ignore this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// Newsletter confirmation email template
export function newsletterConfirmationTemplate(confirmUrl: string): string {
  const contentNo = `
    <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: ${colors.foreground};">
      Bekreft abonnementet ditt
    </h2>
    <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.7; color: ${colors.mutedForeground};">
      Takk for at du vil abonnere pa nyhetsbrevet til Dotty! Klikk pa knappen under for a bekrefte abonnementet.
    </p>
    ${button('Bekreft abonnement', confirmUrl)}
  `;

  const contentEn = `
    <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: ${colors.foreground};">
      Confirm your subscription
    </h2>
    <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.7; color: ${colors.mutedForeground};">
      Thank you for subscribing to the Dotty newsletter! Click the button below to confirm your subscription.
    </p>
    ${button('Confirm subscription', confirmUrl)}
  `;

  return bilingualEmailWrapper(contentNo, contentEn, 'Bekreft nyhetsbrev-abonnement | Confirm newsletter subscription');
}

// GDPR verification email template
export function gdprVerificationTemplate(verifyUrl: string, requestType: 'export' | 'delete'): string {
  const isExport = requestType === 'export';

  const contentNo = `
    <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: ${colors.foreground};">
      ${isExport ? 'Bekreft dataforespørsel' : 'Bekreft sletting av data'}
    </h2>
    <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.7; color: ${colors.mutedForeground};">
      Vi har mottatt en foresporsel om a ${isExport ? 'eksportere dine data' : 'slette dine data'}. Klikk pa knappen under for a bekrefte foresporselen.
    </p>
    ${button(isExport ? 'Bekreft eksport' : 'Bekreft sletting', verifyUrl)}
  `;

  const contentEn = `
    <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: ${colors.foreground};">
      ${isExport ? 'Confirm data export request' : 'Confirm data deletion request'}
    </h2>
    <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.7; color: ${colors.mutedForeground};">
      We have received a request to ${isExport ? 'export your data' : 'delete your data'}. Click the button below to confirm the request.
    </p>
    ${button(isExport ? 'Confirm export' : 'Confirm deletion', verifyUrl)}
  `;

  return bilingualEmailWrapper(contentNo, contentEn, isExport ? 'Bekreft dataeksport' : 'Bekreft sletting av data');
}

// GDPR data export email template
interface DataExportContent {
  ordersCount: number;
  isSubscribed: boolean;
  contactCount: number;
  cookieConsentsCount: number;
  requestsCount: number;
}

export function gdprDataExportTemplate(data: DataExportContent, artistEmail: string): string {
  const statRow = (label: string, value: string) => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid ${colors.border};">
        <p style="margin: 0; font-size: 14px; color: ${colors.mutedForeground};">${label}</p>
      </td>
      <td style="padding: 12px 0; border-bottom: 1px solid ${colors.border}; text-align: right;">
        <p style="margin: 0; font-size: 14px; font-weight: 600; color: ${colors.foreground};">${value}</p>
      </td>
    </tr>
  `;

  const contentNo = `
    <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: ${colors.foreground};">
      Din dataeksport
    </h2>
    <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.7; color: ${colors.mutedForeground};">
      Her er all data vi har lagret om deg. I henhold til GDPR har du rett til a motta denne informasjonen.
    </p>

    <div style="background-color: ${colors.muted}; border-radius: 12px; padding: 20px; margin: 20px 0;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        ${statRow('Ordrehistorikk', `${data.ordersCount} ordrer`)}
        ${statRow('Nyhetsbrev', data.isSubscribed ? 'Abonnert' : 'Ikke abonnert')}
        ${statRow('Kontaktmeldinger', `${data.contactCount} meldinger`)}
        ${statRow('Informasjonskapsler', `${data.cookieConsentsCount} samtykker`)}
        ${statRow('GDPR-foresporsler', `${data.requestsCount} foresporsler`)}
      </table>
    </div>

    <p style="margin: 24px 0 0 0; font-size: 14px; color: ${colors.mutedForeground};">
      Fullstendige data er vedlagt som JSON-fil.
    </p>
  `;

  const contentEn = `
    <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: ${colors.foreground};">
      Your data export
    </h2>
    <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.7; color: ${colors.mutedForeground};">
      Here is all the data we have stored about you. Under GDPR, you have the right to receive this information.
    </p>

    <p style="margin: 24px 0 0 0; font-size: 14px; color: ${colors.mutedForeground};">
      Complete data is attached as a JSON file.
    </p>

    <p style="margin: 24px 0 0 0; font-size: 13px; color: ${colors.mutedForeground};">
      Questions? Contact us at <a href="mailto:${artistEmail}" style="color: ${colors.primary}; text-decoration: none;">${artistEmail}</a>
    </p>
  `;

  return bilingualEmailWrapper(contentNo, contentEn, 'Din dataeksport | Your data export');
}

// GDPR deletion confirmation email template
export function gdprDeletionConfirmationTemplate(): string {
  const deletedItemsNo = `
    <ul style="margin: 16px 0; padding-left: 20px; color: ${colors.mutedForeground}; line-height: 1.8;">
      <li>Nyhetsbrev-abonnement</li>
      <li>Kontaktmeldinger</li>
      <li>Personlig informasjon fra ordrer (ordrehistorikk beholdes anonymisert for regnskapsformat)</li>
    </ul>
  `;

  const deletedItemsEn = `
    <ul style="margin: 16px 0; padding-left: 20px; color: ${colors.mutedForeground}; line-height: 1.8;">
      <li>Newsletter subscription</li>
      <li>Contact messages</li>
      <li>Personal information from orders (order history is kept anonymized for accounting purposes)</li>
    </ul>
  `;

  const contentNo = `
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="width: 64px; height: 64px; margin: 0 auto 16px; background: linear-gradient(135deg, ${colors.success}25 0%, ${colors.success}10 100%); border-radius: 50%; line-height: 64px;">
        <span style="font-size: 32px; color: ${colors.success};">&#10003;</span>
      </div>
    </div>

    <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: ${colors.foreground};">
      Dine data er slettet
    </h2>
    <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.7; color: ${colors.mutedForeground};">
      Vi bekrefter at all din personlige informasjon er slettet fra vare systemer i henhold til GDPR.
    </p>

    <div style="background-color: ${colors.muted}; border-radius: 12px; padding: 20px; margin: 20px 0;">
      <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: ${colors.foreground};">Hva er slettet:</p>
      ${deletedItemsNo}
    </div>
  `;

  const contentEn = `
    <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: ${colors.foreground};">
      Your data has been deleted
    </h2>
    <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.7; color: ${colors.mutedForeground};">
      We confirm that all your personal information has been deleted from our systems in accordance with GDPR.
    </p>

    <div style="background-color: ${colors.muted}; border-radius: 12px; padding: 20px; margin: 20px 0;">
      <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: ${colors.foreground};">What was deleted:</p>
      ${deletedItemsEn}
    </div>

    <p style="margin: 24px 0 0 0; font-size: 13px; color: ${colors.mutedForeground}; text-align: center;">
      This is the last email you will receive from us.
    </p>
  `;

  return bilingualEmailWrapper(contentNo, contentEn, 'Dine data er slettet | Your data has been deleted');
}
