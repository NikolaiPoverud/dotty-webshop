import type { Metadata } from 'next';
import type { Locale } from '@/types';
import Link from 'next/link';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://dotty.no';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const isNorwegian = lang === 'no';

  const title = isNorwegian ? 'Personvernerklæring' : 'Privacy Policy';
  const description = isNorwegian
    ? 'Les om hvordan Dotty. samler inn, bruker og beskytter dine personopplysninger i henhold til GDPR.'
    : 'Learn how Dotty. collects, uses, and protects your personal data in accordance with GDPR.';

  return {
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/${lang}/privacy`,
      languages: {
        'nb-NO': `${BASE_URL}/no/privacy`,
        'en': `${BASE_URL}/en/privacy`,
      },
    },
  };
}

const content = {
  no: {
    title: 'Personvernerklæring',
    intro: 'Denne personvernerklæringen beskriver hvordan Dotty. (behandlingsansvarlig) samler inn, bruker og beskytter dine personopplysninger i henhold til personvernforordningen (GDPR).',
    sections: [
      {
        heading: 'Behandlingsansvarlig',
        text: 'Dotty. er behandlingsansvarlig for behandlingen av personopplysninger som beskrevet i denne personvernerklæringen. Kontakt oss på hei@dotty.no for spørsmål om personvern.',
      },
      {
        heading: 'Hvilke opplysninger vi samler inn',
        subsections: [
          {
            title: 'Ved kjøp',
            items: ['Fullt navn', 'E-postadresse', 'Telefonnummer', 'Leveringsadresse'],
          },
          {
            title: 'Ved nyhetsbrev-påmelding',
            items: ['E-postadresse', 'IP-adresse (for samtykkedokumentasjon)'],
          },
          {
            title: 'Ved kontaktskjema',
            items: ['Navn', 'E-postadresse', 'Meldingsinnhold'],
          },
          {
            title: 'Automatisk innsamlet',
            items: ['Informasjonskapsler for handlekurv og innlogging'],
          },
        ],
      },
      {
        heading: 'Rettslig grunnlag for behandling',
        text: 'Vi behandler dine personopplysninger basert på følgende rettslige grunnlag:',
        list: [
          'Avtale: Behandling av ordre, levering og kundeservice (GDPR art. 6(1)(b))',
          'Samtykke: Nyhetsbrev og markedsføring (GDPR art. 6(1)(a))',
          'Berettiget interesse: Svindelbeskyttelse og sikkerhet (GDPR art. 6(1)(f))',
          'Rettslig forpliktelse: Regnskapsføring og skatteformål (GDPR art. 6(1)(c))',
        ],
      },
      {
        heading: 'Hvordan vi bruker opplysningene',
        list: [
          'Behandle og levere din bestilling',
          'Sende ordrebekreftelse og leveringsoppdateringer',
          'Svare på henvendelser via kontaktskjema',
          'Sende nyhetsbrev (kun med ditt samtykke)',
          'Forbedre våre tjenester og brukeropplevelse',
        ],
      },
      {
        heading: 'Databehandlere og tredjeparter',
        text: 'Vi deler dine opplysninger med følgende tredjeparter som behandler data på våre vegne:',
        processors: [
          { name: 'Stripe', purpose: 'Betalingsbehandling', location: 'EU/USA (EU-US DPF)' },
          { name: 'Supabase', purpose: 'Database og autentisering', location: 'EU (Frankfurt)' },
          { name: 'Resend', purpose: 'E-posttjenester', location: 'USA (EU-US DPF)' },
          { name: 'Vercel', purpose: 'Webhosting', location: 'EU/Global CDN' },
          { name: 'Fraktselskap', purpose: 'Levering av varer', location: 'Norge' },
        ],
        note: 'Alle databehandlere har inngått databehandleravtale (DPA) med oss.',
      },
      {
        heading: 'Oppbevaringstid',
        text: 'Vi oppbevarer dine personopplysninger så lenge det er nødvendig for formålet de ble samlet inn for:',
        retention: [
          { type: 'Ordredata', period: '7 år (lovpålagt regnskapsføring)' },
          { type: 'Nyhetsbrev', period: 'Inntil du melder deg av' },
          { type: 'Kontaktmeldinger', period: '2 år' },
          { type: 'Handlekurv', period: '15 minutter (midlertidig)' },
        ],
      },
      {
        heading: 'Betalingsinformasjon',
        text: 'All betalingsinformasjon håndteres sikkert av våre betalingspartnere (Stripe og Vipps). Vi lagrer aldri kortinformasjon eller annen sensitiv betalingsdata på våre servere. Stripe er PCI DSS-sertifisert.',
      },
      {
        heading: 'Nyhetsbrev',
        text: 'Vi bruker dobbel bekreftelse (double opt-in) for nyhetsbrev. Du må bekrefte abonnementet via e-post før du mottar nyhetsbrev. Du kan når som helst melde deg av via avmeldingslenken i e-postene eller på "Mine data"-siden.',
      },
      {
        heading: 'Informasjonskapsler (cookies)',
        text: 'Vi bruker kun nødvendige informasjonskapsler:',
        cookies: [
          { name: 'Autentisering', purpose: 'Holde deg innlogget', duration: 'Økt' },
          { name: 'Handlekurv', purpose: 'Lagre handlekurv', duration: 'Permanent' },
          { name: 'Samtykke', purpose: 'Huske ditt cookie-valg', duration: 'Permanent' },
        ],
        noCookies: 'Vi bruker ingen sporing, analyse eller markedsføringscookies.',
      },
      {
        heading: 'Dine rettigheter',
        text: 'I henhold til GDPR har du følgende rettigheter:',
        rights: [
          { right: 'Innsyn', desc: 'Be om kopi av dine personopplysninger' },
          { right: 'Retting', desc: 'Korrigere feilaktige opplysninger' },
          { right: 'Sletting', desc: 'Be om sletting av dine data' },
          { right: 'Dataportabilitet', desc: 'Motta dine data i maskinlesbart format' },
          { right: 'Begrensning', desc: 'Begrense behandlingen av dine data' },
          { right: 'Innsigelse', desc: 'Protestere mot behandling basert på berettiget interesse' },
          { right: 'Trekke samtykke', desc: 'Trekke tilbake samtykke når som helst' },
        ],
        howTo: 'Bruk "Mine data"-siden for å utøve dine rettigheter, eller kontakt oss på hei@dotty.no.',
      },
      {
        heading: 'Klagerett',
        text: 'Hvis du mener vi ikke behandler dine personopplysninger korrekt, har du rett til å klage til Datatilsynet:',
        authority: {
          name: 'Datatilsynet',
          address: 'Postboks 458 Sentrum, 0105 Oslo',
          email: 'postkast@datatilsynet.no',
          web: 'https://www.datatilsynet.no',
        },
      },
      {
        heading: 'Sikkerhet',
        text: 'Vi tar datasikkerhet på alvor. Alle data overføres via HTTPS, lagres kryptert, og vi bruker row-level security (RLS) for å beskytte dine opplysninger.',
      },
      {
        heading: 'Endringer',
        text: 'Vi kan oppdatere denne personvernerklæringen ved behov. Ved vesentlige endringer vil vi varsle deg via e-post eller nettstedet.',
      },
    ],
    lastUpdated: 'Sist oppdatert: Januar 2026',
    myDataLink: 'Administrer dine data',
  },
  en: {
    title: 'Privacy Policy',
    intro: 'This privacy policy describes how Dotty. (data controller) collects, uses, and protects your personal data in accordance with the General Data Protection Regulation (GDPR).',
    sections: [
      {
        heading: 'Data Controller',
        text: 'Dotty. is the data controller for the processing of personal data described in this privacy policy. Contact us at hei@dotty.no for privacy questions.',
      },
      {
        heading: 'What information we collect',
        subsections: [
          {
            title: 'When purchasing',
            items: ['Full name', 'Email address', 'Phone number', 'Delivery address'],
          },
          {
            title: 'When subscribing to newsletter',
            items: ['Email address', 'IP address (for consent documentation)'],
          },
          {
            title: 'When using contact form',
            items: ['Name', 'Email address', 'Message content'],
          },
          {
            title: 'Automatically collected',
            items: ['Cookies for shopping cart and login'],
          },
        ],
      },
      {
        heading: 'Legal basis for processing',
        text: 'We process your personal data based on the following legal grounds:',
        list: [
          'Contract: Processing orders, delivery, and customer service (GDPR Art. 6(1)(b))',
          'Consent: Newsletter and marketing (GDPR Art. 6(1)(a))',
          'Legitimate interest: Fraud protection and security (GDPR Art. 6(1)(f))',
          'Legal obligation: Accounting and tax purposes (GDPR Art. 6(1)(c))',
        ],
      },
      {
        heading: 'How we use the information',
        list: [
          'Process and deliver your order',
          'Send order confirmation and delivery updates',
          'Respond to inquiries via contact form',
          'Send newsletters (only with your consent)',
          'Improve our services and user experience',
        ],
      },
      {
        heading: 'Data processors and third parties',
        text: 'We share your data with the following third parties who process data on our behalf:',
        processors: [
          { name: 'Stripe', purpose: 'Payment processing', location: 'EU/USA (EU-US DPF)' },
          { name: 'Supabase', purpose: 'Database and authentication', location: 'EU (Frankfurt)' },
          { name: 'Resend', purpose: 'Email services', location: 'USA (EU-US DPF)' },
          { name: 'Vercel', purpose: 'Web hosting', location: 'EU/Global CDN' },
          { name: 'Shipping companies', purpose: 'Delivery of goods', location: 'Norway' },
        ],
        note: 'All data processors have signed a Data Processing Agreement (DPA) with us.',
      },
      {
        heading: 'Retention periods',
        text: 'We retain your personal data as long as necessary for the purpose for which it was collected:',
        retention: [
          { type: 'Order data', period: '7 years (legal accounting requirement)' },
          { type: 'Newsletter', period: 'Until you unsubscribe' },
          { type: 'Contact messages', period: '2 years' },
          { type: 'Shopping cart', period: '15 minutes (temporary)' },
        ],
      },
      {
        heading: 'Payment information',
        text: 'All payment information is handled securely by our payment partners (Stripe and Vipps). We never store card information or other sensitive payment data on our servers. Stripe is PCI DSS certified.',
      },
      {
        heading: 'Newsletter',
        text: 'We use double opt-in for newsletter subscriptions. You must confirm your subscription via email before receiving newsletters. You can unsubscribe at any time via the unsubscribe link in emails or on the "My Data" page.',
      },
      {
        heading: 'Cookies',
        text: 'We only use essential cookies:',
        cookies: [
          { name: 'Authentication', purpose: 'Keep you logged in', duration: 'Session' },
          { name: 'Shopping cart', purpose: 'Store shopping cart', duration: 'Permanent' },
          { name: 'Consent', purpose: 'Remember your cookie choice', duration: 'Permanent' },
        ],
        noCookies: 'We do not use any tracking, analytics, or marketing cookies.',
      },
      {
        heading: 'Your rights',
        text: 'Under GDPR, you have the following rights:',
        rights: [
          { right: 'Access', desc: 'Request a copy of your personal data' },
          { right: 'Rectification', desc: 'Correct inaccurate data' },
          { right: 'Erasure', desc: 'Request deletion of your data' },
          { right: 'Data portability', desc: 'Receive your data in machine-readable format' },
          { right: 'Restriction', desc: 'Restrict processing of your data' },
          { right: 'Objection', desc: 'Object to processing based on legitimate interest' },
          { right: 'Withdraw consent', desc: 'Withdraw consent at any time' },
        ],
        howTo: 'Use the "My Data" page to exercise your rights, or contact us at hei@dotty.no.',
      },
      {
        heading: 'Right to complain',
        text: 'If you believe we are not handling your personal data correctly, you have the right to complain to the supervisory authority:',
        authority: {
          name: 'Datatilsynet (Norwegian DPA)',
          address: 'Postboks 458 Sentrum, 0105 Oslo',
          email: 'postkast@datatilsynet.no',
          web: 'https://www.datatilsynet.no',
        },
      },
      {
        heading: 'Security',
        text: 'We take data security seriously. All data is transferred via HTTPS, stored encrypted, and we use row-level security (RLS) to protect your data.',
      },
      {
        heading: 'Changes',
        text: 'We may update this privacy policy as needed. For significant changes, we will notify you via email or the website.',
      },
    ],
    lastUpdated: 'Last updated: January 2026',
    myDataLink: 'Manage your data',
  },
};

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = lang as Locale;
  const t = content[locale];

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl sm:text-5xl font-bold mb-8">
          <span className="gradient-text">{t.title}</span>
        </h1>

        <p className="text-lg text-muted-foreground mb-12">{t.intro}</p>

        <div className="space-y-10">
          {t.sections.map((section, i) => (
            <section key={i} className="scroll-mt-24" id={section.heading.toLowerCase().replace(/\s+/g, '-')}>
              <h2 className="text-xl font-semibold mb-4">{section.heading}</h2>

              {'text' in section && <p className="text-muted-foreground mb-4">{section.text}</p>}

              {'subsections' in section && section.subsections && (
                <div className="space-y-4">
                  {section.subsections.map((sub, j) => (
                    <div key={j}>
                      <h3 className="font-medium text-foreground mb-2">{sub.title}</h3>
                      <ul className="list-disc list-inside text-muted-foreground space-y-1">
                        {sub.items.map((item, k) => (
                          <li key={k}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              {'list' in section && section.list && (
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  {section.list.map((item, j) => (
                    <li key={j}>{item}</li>
                  ))}
                </ul>
              )}

              {'processors' in section && section.processors && (
                <div className="mt-4">
                  <div className="bg-muted rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted-foreground/10">
                        <tr>
                          <th className="text-left p-3 font-medium">{locale === 'no' ? 'Tjeneste' : 'Service'}</th>
                          <th className="text-left p-3 font-medium">{locale === 'no' ? 'Formål' : 'Purpose'}</th>
                          <th className="text-left p-3 font-medium">{locale === 'no' ? 'Lokasjon' : 'Location'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {section.processors.map((proc, j) => (
                          <tr key={j} className="border-t border-border">
                            <td className="p-3 font-medium">{proc.name}</td>
                            <td className="p-3 text-muted-foreground">{proc.purpose}</td>
                            <td className="p-3 text-muted-foreground">{proc.location}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {'note' in section && <p className="text-sm text-muted-foreground mt-3">{section.note}</p>}
                </div>
              )}

              {'retention' in section && section.retention && (
                <div className="mt-4 bg-muted rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted-foreground/10">
                      <tr>
                        <th className="text-left p-3 font-medium">{locale === 'no' ? 'Datatype' : 'Data type'}</th>
                        <th className="text-left p-3 font-medium">{locale === 'no' ? 'Oppbevaringstid' : 'Retention period'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {section.retention.map((ret, j) => (
                        <tr key={j} className="border-t border-border">
                          <td className="p-3 font-medium">{ret.type}</td>
                          <td className="p-3 text-muted-foreground">{ret.period}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {'cookies' in section && section.cookies && (
                <div className="mt-4">
                  <div className="bg-muted rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted-foreground/10">
                        <tr>
                          <th className="text-left p-3 font-medium">{locale === 'no' ? 'Navn' : 'Name'}</th>
                          <th className="text-left p-3 font-medium">{locale === 'no' ? 'Formål' : 'Purpose'}</th>
                          <th className="text-left p-3 font-medium">{locale === 'no' ? 'Varighet' : 'Duration'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {section.cookies.map((cookie, j) => (
                          <tr key={j} className="border-t border-border">
                            <td className="p-3 font-medium">{cookie.name}</td>
                            <td className="p-3 text-muted-foreground">{cookie.purpose}</td>
                            <td className="p-3 text-muted-foreground">{cookie.duration}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {'noCookies' in section && (
                    <p className="text-sm text-success mt-3">{section.noCookies}</p>
                  )}
                </div>
              )}

              {'rights' in section && section.rights && (
                <div className="mt-4 space-y-3">
                  {section.rights.map((r, j) => (
                    <div key={j} className="flex gap-3">
                      <span className="font-medium text-primary min-w-[120px]">{r.right}</span>
                      <span className="text-muted-foreground">{r.desc}</span>
                    </div>
                  ))}
                  {'howTo' in section && (
                    <p className="text-muted-foreground mt-4 pt-4 border-t border-border">{section.howTo}</p>
                  )}
                </div>
              )}

              {'authority' in section && section.authority && (
                <div className="mt-4 bg-muted rounded-lg p-4">
                  <p className="font-medium">{section.authority.name}</p>
                  <p className="text-sm text-muted-foreground mt-1">{section.authority.address}</p>
                  <p className="text-sm text-muted-foreground">
                    <a href={`mailto:${section.authority.email}`} className="text-primary hover:underline">
                      {section.authority.email}
                    </a>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <a href={section.authority.web} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      {section.authority.web}
                    </a>
                  </p>
                </div>
              )}
            </section>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">{t.lastUpdated}</p>
          <Link
            href={`/${locale}/my-data`}
            className="text-sm text-primary hover:underline"
          >
            {t.myDataLink} →
          </Link>
        </div>
      </div>
    </div>
  );
}
