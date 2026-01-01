// Dotty Brand Colors
const colors = {
  background: '#0a0a0a',
  foreground: '#fafafa',
  primary: '#ec4899',
  primaryLight: '#f472b6',
  accent: '#a855f7',
  muted: '#27272a',
  mutedForeground: '#a1a1aa',
  border: '#3f3f46',
  success: '#22c55e',
};

// Base email wrapper with Dotty branding
function emailWrapper(content: string, previewText?: string): string {
  return `
<!DOCTYPE html>
<html lang="no">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Dotty</title>
  ${previewText ? `<!--[if !mso]><!--><meta name="x-apple-disable-message-reformatting"><!--<![endif]--><div style="display:none;font-size:1px;color:#0a0a0a;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${previewText}</div>` : ''}
  <style>
    body { margin: 0; padding: 0; background-color: ${colors.background}; }
    table { border-spacing: 0; }
    td { padding: 0; }
    img { border: 0; }
    @media screen and (max-width: 600px) {
      .container { width: 100% !important; }
      .content { padding: 24px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: ${colors.background}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: ${colors.background};">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" class="container" width="600" cellspacing="0" cellpadding="0" style="background-color: ${colors.muted}; border-radius: 16px; overflow: hidden;">
          <!-- Header with Logo -->
          <tr>
            <td style="padding: 32px 40px; text-align: center; border-bottom: 1px solid ${colors.border};">
              <h1 style="margin: 0; font-size: 32px; font-weight: 800; letter-spacing: -1px;">
                <span style="color: ${colors.primary};">Dotty</span><span style="color: ${colors.foreground};">.</span>
              </h1>
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
            <td style="padding: 24px 40px; text-align: center; border-top: 1px solid ${colors.border};">
              <p style="margin: 0 0 8px 0; font-size: 12px; color: ${colors.mutedForeground};">
                Pop-art for alle
              </p>
              <p style="margin: 0; font-size: 12px; color: ${colors.mutedForeground};">
                <a href="https://dotty.art" style="color: ${colors.primary}; text-decoration: none;">dotty.art</a>
              </p>
            </td>
          </tr>
        </table>

        <!-- Legal Footer -->
        <table role="presentation" width="600" cellspacing="0" cellpadding="0">
          <tr>
            <td style="padding: 24px 40px; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: ${colors.mutedForeground};">
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

// Primary button style
function button(text: string, url: string): string {
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 24px 0;">
      <tr>
        <td style="background-color: ${colors.primary}; border-radius: 50px; text-align: center;">
          <a href="${url}" style="display: inline-block; padding: 16px 32px; font-size: 14px; font-weight: 600; color: ${colors.background}; text-decoration: none; text-transform: uppercase; letter-spacing: 1px;">
            ${text}
          </a>
        </td>
      </tr>
    </table>
  `;
}

// Divider
function divider(): string {
  return `<hr style="border: none; border-top: 1px solid ${colors.border}; margin: 24px 0;">`;
}

// ============================================
// EMAIL TEMPLATES
// ============================================

export function testEmailTemplate(): string {
  const content = `
    <div style="text-align: center;">
      <!-- Icon -->
      <div style="width: 64px; height: 64px; margin: 0 auto 24px; background-color: ${colors.primary}20; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
        <span style="font-size: 32px;">&#10003;</span>
      </div>

      <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: ${colors.foreground};">
        Test E-post
      </h2>

      <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: ${colors.mutedForeground};">
        Dette er en test-epost fra Dotty admin panel. Hvis du ser denne meldingen, fungerer e-postsystemet korrekt!
      </p>

      ${divider()}

      <p style="margin: 0; font-size: 14px; color: ${colors.mutedForeground};">
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
      <td style="padding: 12px 0; border-bottom: 1px solid ${colors.border};">
        <p style="margin: 0; font-size: 14px; color: ${colors.foreground}; font-weight: 500;">
          ${item.title}
        </p>
        <p style="margin: 4px 0 0 0; font-size: 12px; color: ${colors.mutedForeground};">
          Antall: ${item.quantity}
        </p>
      </td>
      <td style="padding: 12px 0; border-bottom: 1px solid ${colors.border}; text-align: right;">
        <p style="margin: 0; font-size: 14px; color: ${colors.foreground};">
          ${formatPrice(item.price * item.quantity)}
        </p>
      </td>
    </tr>
  `).join('');

  const content = `
    <!-- Success Header -->
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="width: 80px; height: 80px; margin: 0 auto 24px; background-color: ${colors.success}20; border-radius: 50%; line-height: 80px;">
        <span style="font-size: 40px; color: ${colors.success};">&#10003;</span>
      </div>

      <h2 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 700; color: ${colors.foreground};">
        Takk for din bestilling!
      </h2>

      <p style="margin: 0; font-size: 16px; color: ${colors.mutedForeground};">
        Hei ${data.customerName}, vi har mottatt din ordre.
      </p>
    </div>

    <!-- Order Number -->
    <div style="background-color: ${colors.background}; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
      <p style="margin: 0 0 4px 0; font-size: 12px; color: ${colors.mutedForeground}; text-transform: uppercase; letter-spacing: 1px;">
        Ordrenummer
      </p>
      <p style="margin: 0; font-size: 24px; font-weight: 700; color: ${colors.primary}; font-family: monospace;">
        ${data.orderNumber}
      </p>
    </div>

    ${divider()}

    <!-- Order Items -->
    <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: ${colors.foreground};">
      Din bestilling
    </h3>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
      ${itemsHtml}

      <!-- Subtotal -->
      <tr>
        <td style="padding: 12px 0;">
          <p style="margin: 0; font-size: 14px; color: ${colors.mutedForeground};">Delsum</p>
        </td>
        <td style="padding: 12px 0; text-align: right;">
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

      <!-- Total -->
      <tr>
        <td style="padding: 16px 0 0 0; border-top: 1px solid ${colors.border};">
          <p style="margin: 0; font-size: 16px; font-weight: 700; color: ${colors.foreground};">Totalt</p>
        </td>
        <td style="padding: 16px 0 0 0; border-top: 1px solid ${colors.border}; text-align: right;">
          <p style="margin: 0; font-size: 20px; font-weight: 700; color: ${colors.primary};">${formatPrice(data.total)}</p>
        </td>
      </tr>
    </table>

    ${divider()}

    <!-- Shipping Address -->
    <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: ${colors.foreground};">
      Leveringsadresse
    </h3>

    <div style="background-color: ${colors.background}; border-radius: 12px; padding: 16px;">
      <p style="margin: 0; font-size: 14px; line-height: 1.6; color: ${colors.mutedForeground};">
        ${data.shippingAddress.line1}<br>
        ${data.shippingAddress.line2 ? data.shippingAddress.line2 + '<br>' : ''}
        ${data.shippingAddress.postal_code} ${data.shippingAddress.city}<br>
        ${data.shippingAddress.country}
      </p>
    </div>

    ${divider()}

    <p style="margin: 0; font-size: 14px; line-height: 1.6; color: ${colors.mutedForeground}; text-align: center;">
      Vi kontakter deg snart med informasjon om frakt. Har du sporsmal? Svar pa denne e-posten.
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
      <div style="width: 80px; height: 80px; margin: 0 auto 24px; background-color: ${colors.accent}20; border-radius: 50%; line-height: 80px;">
        <span style="font-size: 40px;">&#128230;</span>
      </div>

      <h2 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 700; color: ${colors.foreground};">
        Din ordre er sendt!
      </h2>

      <p style="margin: 0; font-size: 16px; color: ${colors.mutedForeground};">
        Hei ${data.customerName}, din bestilling er pa vei til deg.
      </p>
    </div>

    <!-- Order Number -->
    <div style="background-color: ${colors.background}; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
      <p style="margin: 0 0 4px 0; font-size: 12px; color: ${colors.mutedForeground}; text-transform: uppercase; letter-spacing: 1px;">
        Ordrenummer
      </p>
      <p style="margin: 0; font-size: 20px; font-weight: 700; color: ${colors.foreground}; font-family: monospace;">
        ${data.orderNumber}
      </p>
    </div>

    ${data.trackingNumber ? `
    ${divider()}

    <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: ${colors.foreground};">
      Sporingsinformasjon
    </h3>

    <div style="background-color: ${colors.background}; border-radius: 12px; padding: 16px;">
      ${data.carrier ? `<p style="margin: 0 0 8px 0; font-size: 14px; color: ${colors.mutedForeground};">Fraktselskap: <strong style="color: ${colors.foreground};">${data.carrier}</strong></p>` : ''}
      <p style="margin: 0; font-size: 14px; color: ${colors.mutedForeground};">
        Sporingsnummer: <strong style="color: ${colors.foreground}; font-family: monospace;">${data.trackingNumber}</strong>
      </p>
    </div>

    ${data.trackingUrl ? `
    <div style="text-align: center;">
      ${button('Spor forsendelsen', data.trackingUrl)}
    </div>
    ` : ''}
    ` : ''}

    ${divider()}

    <p style="margin: 0; font-size: 14px; line-height: 1.6; color: ${colors.mutedForeground}; text-align: center;">
      Takk for at du handler hos Dotty! Har du sporsmal? Svar pa denne e-posten.
    </p>
  `;

  return emailWrapper(content, `Din ordre #${data.orderNumber} er sendt!`);
}
