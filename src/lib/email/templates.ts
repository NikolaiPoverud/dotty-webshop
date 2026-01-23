import { formatPrice } from '@/lib/utils';

const COLORS = {
  background: '#131316',
  foreground: '#fafafa',
  primary: '#FE206A',
  primaryDark: '#E01A5E',
  accent: '#a855f7',
  muted: '#27272a',
  mutedForeground: '#a1a1aa',
  border: '#3f3f46',
  card: '#1a1a1f',
  success: '#22c55e',
} as const;

const STYLES = {
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  monoFont: "'SF Mono', Monaco, monospace",
} as const;

function previewTextHtml(text: string): string {
  return `<!--[if !mso]><!--><meta name="x-apple-disable-message-reformatting"><!--<![endif]--><div style="display:none;font-size:1px;color:${COLORS.background};line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${text}</div>`;
}

function emailWrapper(content: string, previewText?: string): string {
  return `<!DOCTYPE html>
<html lang="no">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Dotty</title>
  ${previewText ? previewTextHtml(previewText) : ''}
  <style>
    body { margin: 0; padding: 0; background-color: ${COLORS.background}; }
    table { border-spacing: 0; }
    td { padding: 0; }
    img { border: 0; }
    @media screen and (max-width: 600px) {
      .container { width: 100% !important; }
      .content { padding: 20px 12px !important; }
      .header { padding: 20px 12px !important; }
      .footer { padding: 12px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: ${COLORS.background}; font-family: ${STYLES.fontFamily}; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: ${COLORS.background};">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" class="container" width="600" cellspacing="0" cellpadding="0" style="background-color: ${COLORS.card}; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);">
          <tr>
            <td class="header" style="padding: 32px 40px; text-align: center; background: linear-gradient(135deg, ${COLORS.card} 0%, ${COLORS.muted} 100%);">
              <h1 style="margin: 0; font-size: 36px; font-weight: 800; letter-spacing: -1px;">
                <span style="color: ${COLORS.primary};">Dotty</span><span style="color: ${COLORS.foreground};">.</span>
              </h1>
              <p style="margin: 8px 0 0 0; font-size: 12px; color: ${COLORS.mutedForeground}; text-transform: uppercase; letter-spacing: 2px;">
                Pop-Art for Alle
              </p>
            </td>
          </tr>
          <tr>
            <td class="content" style="padding: 32px 24px;">
              ${content}
            </td>
          </tr>
          <tr>
            <td class="footer" style="padding: 24px 40px; text-align: center; background-color: ${COLORS.muted};">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="text-align: center;">
                    <p style="margin: 0 0 8px 0; font-size: 11px; color: ${COLORS.mutedForeground};">
                      <a href="https://dotty.no" style="color: ${COLORS.primary}; text-decoration: none; font-weight: 600;">dotty.no</a>
                    </p>
                    <p style="margin: 0; font-size: 11px; color: ${COLORS.mutedForeground};">
                      Kontakt: <a href="mailto:hei@dotty.no" style="color: ${COLORS.mutedForeground}; text-decoration: underline;">hei@dotty.no</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" class="container">
          <tr>
            <td style="padding: 20px 40px; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: ${COLORS.mutedForeground}; line-height: 1.5;">
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

function button(text: string, url: string): string {
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 24px auto;">
      <tr>
        <td style="background: linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%); border-radius: 50px; text-align: center; box-shadow: 0 4px 16px rgba(254, 32, 106, 0.3);">
          <a href="${url}" style="display: inline-block; padding: 16px 40px; font-size: 14px; font-weight: 700; color: ${COLORS.foreground}; text-decoration: none; text-transform: uppercase; letter-spacing: 1px;">
            ${text}
          </a>
        </td>
      </tr>
    </table>`;
}

function divider(): string {
  return `<hr style="border: none; border-top: 1px solid ${COLORS.border}; margin: 28px 0;">`;
}

function infoBox(content: string): string {
  return `
    <div style="background-color: ${COLORS.muted}; border-radius: 12px; padding: 20px; margin: 20px 0; border-left: 4px solid ${COLORS.primary};">
      ${content}
    </div>`;
}

function successIcon(size: number = 72): string {
  return `
    <div style="width: ${size}px; height: ${size}px; margin: 0 auto 24px; background: linear-gradient(135deg, ${COLORS.success}25 0%, ${COLORS.success}10 100%); border-radius: 50%; line-height: ${size}px; text-align: center;">
      <span style="font-size: ${Math.round(size * 0.5)}px; color: ${COLORS.success};">&#10003;</span>
    </div>`;
}

export function testEmailTemplate(): string {
  const content = `
    <div style="text-align: center;">
      ${successIcon()}
      <h2 style="margin: 0 0 16px 0; font-size: 26px; font-weight: 700; color: ${COLORS.foreground};">
        Test E-post
      </h2>
      <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.7; color: ${COLORS.mutedForeground};">
        Dette er en test-epost fra Dotty admin panel. Hvis du ser denne meldingen, fungerer e-postsystemet korrekt!
      </p>
      ${divider()}
      <p style="margin: 0; font-size: 13px; color: ${COLORS.mutedForeground};">
        Sendt fra admin dashboard
      </p>
    </div>`;

  return emailWrapper(content, 'Test e-post fra Dotty');
}

interface OrderItem {
  title: string;
  quantity: number;
  price: number;
}

interface ShippingAddress {
  line1: string;
  line2?: string;
  city: string;
  postal_code: string;
  country: string;
}

interface OrderConfirmationData {
  orderNumber: string;
  customerName: string;
  items: OrderItem[];
  subtotal: number;
  discount?: number;
  shipping?: number;
  total: number;
  shippingAddress: ShippingAddress;
}

function orderItemRow(item: OrderItem): string {
  return `
    <tr>
      <td width="60%" style="padding: 16px 0; border-bottom: 1px solid ${COLORS.border};">
        <p style="margin: 0; font-size: 15px; color: ${COLORS.foreground}; font-weight: 600;">${item.title}</p>
        <p style="margin: 6px 0 0 0; font-size: 13px; color: ${COLORS.mutedForeground};">Antall: ${item.quantity}</p>
      </td>
      <td width="40%" style="padding: 16px 0; border-bottom: 1px solid ${COLORS.border}; text-align: right; vertical-align: top;">
        <p style="margin: 0; font-size: 15px; color: ${COLORS.foreground}; font-weight: 600;">${formatPrice(item.price * item.quantity)}</p>
      </td>
    </tr>`;
}

function summaryRow(label: string, value: string, color: string = COLORS.mutedForeground): string {
  return `
    <tr>
      <td width="60%" style="padding: 4px 0;">
        <p style="margin: 0; font-size: 14px; color: ${color};">${label}</p>
      </td>
      <td width="40%" style="padding: 4px 0; text-align: right;">
        <p style="margin: 0; font-size: 14px; color: ${color === COLORS.success ? COLORS.success : COLORS.foreground};">${value}</p>
      </td>
    </tr>`;
}

function orderNumberBox(orderNumber: string): string {
  return infoBox(`
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
      <tr>
        <td style="text-align: center;">
          <p style="margin: 0 0 4px 0; font-size: 11px; color: ${COLORS.mutedForeground}; text-transform: uppercase; letter-spacing: 2px;">Ordrenummer</p>
          <p style="margin: 0; font-size: 28px; font-weight: 700; color: ${COLORS.primary}; font-family: ${STYLES.monoFont};">${orderNumber}</p>
        </td>
      </tr>
    </table>`);
}

function sectionHeading(text: string): string {
  return `<h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 700; color: ${COLORS.foreground}; text-transform: uppercase; letter-spacing: 1px;">${text}</h3>`;
}

function formatShippingAddress(name: string, address: ShippingAddress): string {
  const line2Html = address.line2 ? `${address.line2}<br>` : '';
  return `
    <p style="margin: 0; font-size: 14px; line-height: 1.7; color: ${COLORS.foreground};">
      <strong>${name}</strong><br>
      <span style="color: ${COLORS.mutedForeground};">
        ${address.line1}<br>
        ${line2Html}
        ${address.postal_code} ${address.city}<br>
        ${address.country}
      </span>
    </p>`;
}

export function orderConfirmationTemplate(data: OrderConfirmationData): string {
  const itemsHtml = data.items.map(orderItemRow).join('');

  const discountRow = data.discount
    ? summaryRow('Rabatt', `-${formatPrice(data.discount)}`, COLORS.success)
    : '';

  const shippingRow = data.shipping !== undefined
    ? summaryRow('Frakt', data.shipping === 0 ? 'Gratis' : formatPrice(data.shipping))
    : '';

  const content = `
    <div style="text-align: center; margin-bottom: 32px;">
      ${successIcon(80)}
      <h2 style="margin: 0 0 12px 0; font-size: 28px; font-weight: 700; color: ${COLORS.foreground};">
        Takk for din bestilling!
      </h2>
      <p style="margin: 0; font-size: 16px; color: ${COLORS.mutedForeground};">
        Hei ${data.customerName}, vi har mottatt din ordre.
      </p>
    </div>

    ${orderNumberBox(data.orderNumber)}
    ${divider()}

    ${sectionHeading('Din bestilling')}

    <div style="background-color: ${COLORS.muted}; border-radius: 12px; padding: 16px; margin: 16px 0;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="table-layout: fixed; max-width: 100%;">
        ${itemsHtml}
        <tr>
          <td width="60%" style="padding: 16px 0 8px 0;">
            <p style="margin: 0; font-size: 14px; color: ${COLORS.mutedForeground};">Delsum</p>
          </td>
          <td width="40%" style="padding: 16px 0 8px 0; text-align: right;">
            <p style="margin: 0; font-size: 14px; color: ${COLORS.foreground};">${formatPrice(data.subtotal)}</p>
          </td>
        </tr>
        ${discountRow}
        ${shippingRow}
        <tr>
          <td width="60%" style="padding: 20px 0 0 0; border-top: 2px solid ${COLORS.border};">
            <p style="margin: 0; font-size: 16px; font-weight: 700; color: ${COLORS.foreground};">TOTALT</p>
            <p style="margin: 4px 0 0 0; font-size: 11px; color: ${COLORS.mutedForeground};">Inkl. mva</p>
          </td>
          <td width="40%" style="padding: 20px 0 0 0; border-top: 2px solid ${COLORS.border}; text-align: right;">
            <p style="margin: 0; font-size: 20px; font-weight: 700; color: ${COLORS.primary};">${formatPrice(data.total)}</p>
          </td>
        </tr>
      </table>
    </div>

    ${divider()}
    ${sectionHeading('Leveringsadresse')}
    ${infoBox(formatShippingAddress(data.customerName, data.shippingAddress))}
    ${divider()}

    <p style="margin: 0; font-size: 14px; line-height: 1.7; color: ${COLORS.mutedForeground}; text-align: center;">
      Vi kontakter deg snart med informasjon om frakt.<br>
      Har du sporsmal? Svar pa denne e-posten.
    </p>`;

  return emailWrapper(content, `Ordrebekreftelse #${data.orderNumber}`);
}

interface ShippingData {
  orderNumber: string;
  customerName: string;
  trackingNumber?: string;
  trackingUrl?: string;
  carrier?: string;
}

function shippingIcon(): string {
  return `
    <div style="width: 80px; height: 80px; margin: 0 auto 24px; background: linear-gradient(135deg, ${COLORS.accent}25 0%, ${COLORS.accent}10 100%); border-radius: 50%; line-height: 80px; text-align: center;">
      <span style="font-size: 40px;">&#128230;</span>
    </div>`;
}

function trackingInfoBox(data: ShippingData): string {
  if (!data.trackingNumber) return '';

  const carrierHtml = data.carrier
    ? `<p style="margin: 0 0 12px 0; font-size: 14px; color: ${COLORS.mutedForeground};">Fraktselskap: <strong style="color: ${COLORS.foreground};">${data.carrier}</strong></p>`
    : '';

  const trackingButton = data.trackingUrl
    ? `<div style="text-align: center;">${button('Spor forsendelsen', data.trackingUrl)}</div>`
    : '';

  return `
    ${divider()}
    ${sectionHeading('Sporingsinformasjon')}
    ${infoBox(`
      ${carrierHtml}
      <p style="margin: 0; font-size: 14px; color: ${COLORS.mutedForeground};">
        Sporingsnummer: <strong style="color: ${COLORS.foreground}; font-family: ${STYLES.monoFont};">${data.trackingNumber}</strong>
      </p>
    `)}
    ${trackingButton}`;
}

export function shippingNotificationTemplate(data: ShippingData): string {
  const content = `
    <div style="text-align: center; margin-bottom: 32px;">
      ${shippingIcon()}
      <h2 style="margin: 0 0 12px 0; font-size: 28px; font-weight: 700; color: ${COLORS.foreground};">
        Din ordre er sendt!
      </h2>
      <p style="margin: 0; font-size: 16px; color: ${COLORS.mutedForeground};">
        Hei ${data.customerName}, din bestilling er pa vei til deg.
      </p>
    </div>

    ${infoBox(`
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="text-align: center;">
            <p style="margin: 0 0 4px 0; font-size: 11px; color: ${COLORS.mutedForeground}; text-transform: uppercase; letter-spacing: 2px;">Ordrenummer</p>
            <p style="margin: 0; font-size: 22px; font-weight: 700; color: ${COLORS.foreground}; font-family: ${STYLES.monoFont};">${data.orderNumber}</p>
          </td>
        </tr>
      </table>
    `)}

    ${trackingInfoBox(data)}
    ${divider()}

    <p style="margin: 0; font-size: 14px; line-height: 1.7; color: ${COLORS.mutedForeground}; text-align: center;">
      Takk for at du handler hos Dotty!<br>
      Har du sporsmal? Svar pa denne e-posten.
    </p>`;

  return emailWrapper(content, `Din ordre #${data.orderNumber} er sendt!`);
}

function bilingualEmailWrapper(contentNo: string, contentEn: string, previewText?: string): string {
  return `<!DOCTYPE html>
<html lang="no">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Dotty</title>
  ${previewText ? previewTextHtml(previewText) : ''}
  <style>
    body { margin: 0; padding: 0; background-color: ${COLORS.background}; }
    table { border-spacing: 0; }
    td { padding: 0; }
    @media screen and (max-width: 600px) {
      .container { width: 100% !important; }
      .content { padding: 24px 16px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: ${COLORS.background}; font-family: ${STYLES.fontFamily}; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: ${COLORS.background};">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" class="container" width="600" cellspacing="0" cellpadding="0" style="background-color: ${COLORS.card}; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);">
          <tr>
            <td style="padding: 32px 40px; text-align: center; background: linear-gradient(135deg, ${COLORS.card} 0%, ${COLORS.muted} 100%);">
              <h1 style="margin: 0; font-size: 36px; font-weight: 800; letter-spacing: -1px;">
                <span style="color: ${COLORS.primary};">Dotty</span><span style="color: ${COLORS.foreground};">.</span>
              </h1>
            </td>
          </tr>
          <tr>
            <td class="content" style="padding: 40px;">${contentNo}</td>
          </tr>
          <tr>
            <td style="padding: 0 40px;">
              <hr style="border: none; border-top: 1px solid ${COLORS.border}; margin: 0;">
            </td>
          </tr>
          <tr>
            <td class="content" style="padding: 40px;">${contentEn}</td>
          </tr>
          <tr>
            <td style="padding: 24px 40px; text-align: center; background-color: ${COLORS.muted};">
              <p style="margin: 0; font-size: 11px; color: ${COLORS.mutedForeground};">
                <a href="https://dotty.no" style="color: ${COLORS.primary}; text-decoration: none; font-weight: 600;">dotty.no</a>
              </p>
            </td>
          </tr>
        </table>
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" class="container">
          <tr>
            <td style="padding: 20px 40px; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: ${COLORS.mutedForeground}; line-height: 1.5;">
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

function bilingualHeading(textNo: string, textEn: string): { no: string; en: string } {
  const style = `margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: ${COLORS.foreground};`;
  return {
    no: `<h2 style="${style}">${textNo}</h2>`,
    en: `<h2 style="${style}">${textEn}</h2>`,
  };
}

function bilingualParagraph(textNo: string, textEn: string): { no: string; en: string } {
  const style = `margin: 0 0 24px 0; font-size: 15px; line-height: 1.7; color: ${COLORS.mutedForeground};`;
  return {
    no: `<p style="${style}">${textNo}</p>`,
    en: `<p style="${style}">${textEn}</p>`,
  };
}

export function newsletterConfirmationTemplate(confirmUrl: string): string {
  const heading = bilingualHeading('Bekreft abonnementet ditt', 'Confirm your subscription');
  const paragraph = bilingualParagraph(
    'Takk for at du vil abonnere pa nyhetsbrevet til Dotty! Klikk pa knappen under for a bekrefte abonnementet.',
    'Thank you for subscribing to the Dotty newsletter! Click the button below to confirm your subscription.'
  );

  const contentNo = `${heading.no}${paragraph.no}${button('Bekreft abonnement', confirmUrl)}`;
  const contentEn = `${heading.en}${paragraph.en}${button('Confirm subscription', confirmUrl)}`;

  return bilingualEmailWrapper(contentNo, contentEn, 'Bekreft nyhetsbrev-abonnement | Confirm newsletter subscription');
}

export function gdprVerificationTemplate(verifyUrl: string, requestType: 'export' | 'delete'): string {
  const isExport = requestType === 'export';

  const headingNo = isExport ? 'Bekreft dataforespørsel' : 'Bekreft sletting av data';
  const headingEn = isExport ? 'Confirm data export request' : 'Confirm data deletion request';
  const heading = bilingualHeading(headingNo, headingEn);

  const paragraphNo = `Vi har mottatt en foresporsel om a ${isExport ? 'eksportere dine data' : 'slette dine data'}. Klikk pa knappen under for a bekrefte foresporselen.`;
  const paragraphEn = `We have received a request to ${isExport ? 'export your data' : 'delete your data'}. Click the button below to confirm the request.`;
  const paragraph = bilingualParagraph(paragraphNo, paragraphEn);

  const buttonNo = isExport ? 'Bekreft eksport' : 'Bekreft sletting';
  const buttonEn = isExport ? 'Confirm export' : 'Confirm deletion';

  const contentNo = `${heading.no}${paragraph.no}${button(buttonNo, verifyUrl)}`;
  const contentEn = `${heading.en}${paragraph.en}${button(buttonEn, verifyUrl)}`;

  const previewText = isExport ? 'Bekreft dataeksport' : 'Bekreft sletting av data';

  return bilingualEmailWrapper(contentNo, contentEn, previewText);
}

interface DataExportContent {
  ordersCount: number;
  isSubscribed: boolean;
  contactCount: number;
  cookieConsentsCount: number;
  requestsCount: number;
}

function statRow(label: string, value: string): string {
  return `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid ${COLORS.border};">
        <p style="margin: 0; font-size: 14px; color: ${COLORS.mutedForeground};">${label}</p>
      </td>
      <td style="padding: 12px 0; border-bottom: 1px solid ${COLORS.border}; text-align: right;">
        <p style="margin: 0; font-size: 14px; font-weight: 600; color: ${COLORS.foreground};">${value}</p>
      </td>
    </tr>`;
}

export function gdprDataExportTemplate(data: DataExportContent, artistEmail: string): string {
  const heading = bilingualHeading('Din dataeksport', 'Your data export');
  const paragraph = bilingualParagraph(
    'Her er all data vi har lagret om deg. I henhold til GDPR har du rett til a motta denne informasjonen.',
    'Here is all the data we have stored about you. Under GDPR, you have the right to receive this information.'
  );

  const statsTable = `
    <div style="background-color: ${COLORS.muted}; border-radius: 12px; padding: 20px; margin: 20px 0;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        ${statRow('Ordrehistorikk', `${data.ordersCount} ordrer`)}
        ${statRow('Nyhetsbrev', data.isSubscribed ? 'Abonnert' : 'Ikke abonnert')}
        ${statRow('Kontaktmeldinger', `${data.contactCount} meldinger`)}
        ${statRow('Informasjonskapsler', `${data.cookieConsentsCount} samtykker`)}
        ${statRow('GDPR-foresporsler', `${data.requestsCount} foresporsler`)}
      </table>
    </div>`;

  const footnoteStyle = `margin: 24px 0 0 0; font-size: 14px; color: ${COLORS.mutedForeground};`;

  const contentNo = `
    ${heading.no}
    ${paragraph.no}
    ${statsTable}
    <p style="${footnoteStyle}">Fullstendige data er vedlagt som JSON-fil.</p>`;

  const contentEn = `
    ${heading.en}
    ${paragraph.en}
    <p style="${footnoteStyle}">Complete data is attached as a JSON file.</p>
    <p style="margin: 24px 0 0 0; font-size: 13px; color: ${COLORS.mutedForeground};">
      Questions? Contact us at <a href="mailto:${artistEmail}" style="color: ${COLORS.primary}; text-decoration: none;">${artistEmail}</a>
    </p>`;

  return bilingualEmailWrapper(contentNo, contentEn, 'Din dataeksport | Your data export');
}

function deletedItemsList(language: 'no' | 'en'): string {
  const items = language === 'no'
    ? [
        'Nyhetsbrev-abonnement',
        'Kontaktmeldinger',
        'Personlig informasjon fra ordrer (ordrehistorikk beholdes anonymisert for regnskapsformat)',
      ]
    : [
        'Newsletter subscription',
        'Contact messages',
        'Personal information from orders (order history is kept anonymized for accounting purposes)',
      ];

  const listItems = items.map(item => `<li>${item}</li>`).join('');
  return `<ul style="margin: 16px 0; padding-left: 20px; color: ${COLORS.mutedForeground}; line-height: 1.8;">${listItems}</ul>`;
}

function deletedItemsBox(language: 'no' | 'en'): string {
  const label = language === 'no' ? 'Hva er slettet:' : 'What was deleted:';
  return `
    <div style="background-color: ${COLORS.muted}; border-radius: 12px; padding: 20px; margin: 20px 0;">
      <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: ${COLORS.foreground};">${label}</p>
      ${deletedItemsList(language)}
    </div>`;
}

export function gdprDeletionConfirmationTemplate(): string {
  const heading = bilingualHeading('Dine data er slettet', 'Your data has been deleted');
  const paragraph = bilingualParagraph(
    'Vi bekrefter at all din personlige informasjon er slettet fra vare systemer i henhold til GDPR.',
    'We confirm that all your personal information has been deleted from our systems in accordance with GDPR.'
  );

  const contentNo = `
    <div style="text-align: center; margin-bottom: 24px;">
      ${successIcon(64)}
    </div>
    ${heading.no}
    ${paragraph.no}
    ${deletedItemsBox('no')}`;

  const contentEn = `
    ${heading.en}
    ${paragraph.en}
    ${deletedItemsBox('en')}
    <p style="margin: 24px 0 0 0; font-size: 13px; color: ${COLORS.mutedForeground}; text-align: center;">
      This is the last email you will receive from us.
    </p>`;

  return bilingualEmailWrapper(contentNo, contentEn, 'Dine data er slettet | Your data has been deleted');
}
