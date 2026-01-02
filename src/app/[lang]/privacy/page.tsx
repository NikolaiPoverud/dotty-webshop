import type { Locale } from '@/types';

const content = {
  no: {
    title: 'Personvern',
    intro: 'Denne personvernerklæringen beskriver hvordan Dotty. samler inn og bruker personopplysninger når du handler hos oss.',
    sections: [
      {
        heading: 'Hvilke opplysninger vi samler inn',
        text: 'Når du bestiller fra oss, samler vi inn nødvendige opplysninger for å fullføre kjøpet: navn, e-postadresse, telefonnummer og leveringsadresse.',
      },
      {
        heading: 'Hvordan vi bruker opplysningene',
        text: 'Vi bruker opplysningene til å behandle din bestilling, sende ordrebekreftelse, og levere varene til deg. Vi deler ikke dine opplysninger med tredjeparter, unntatt fraktselskap for levering.',
      },
      {
        heading: 'Betalingsinformasjon',
        text: 'All betalingsinformasjon håndteres sikkert av våre betalingspartnere (Stripe og Vipps). Vi lagrer aldri kortinformasjon.',
      },
      {
        heading: 'Nyhetsbrev',
        text: 'Hvis du melder deg på vårt nyhetsbrev, lagrer vi din e-postadresse. Du kan når som helst melde deg av ved å klikke på avmeldingslenken i e-postene.',
      },
      {
        heading: 'Dine rettigheter',
        text: 'Du har rett til å be om innsyn, retting eller sletting av dine personopplysninger. Kontakt oss via Instagram @dottyartwork eller kontaktskjemaet på nettsiden.',
      },
      {
        heading: 'Informasjonskapsler',
        text: 'Vi bruker kun nødvendige informasjonskapsler for å håndtere handlekurv og øktnøkkel. Ingen sporingsformål.',
      },
    ],
    lastUpdated: 'Sist oppdatert: Januar 2026',
  },
  en: {
    title: 'Privacy Policy',
    intro: 'This privacy policy describes how Dotty. collects and uses personal information when you shop with us.',
    sections: [
      {
        heading: 'What information we collect',
        text: 'When you order from us, we collect necessary information to complete the purchase: name, email address, phone number, and delivery address.',
      },
      {
        heading: 'How we use the information',
        text: 'We use the information to process your order, send order confirmation, and deliver the goods to you. We do not share your information with third parties, except shipping companies for delivery.',
      },
      {
        heading: 'Payment information',
        text: 'All payment information is handled securely by our payment partners (Stripe and Vipps). We never store card information.',
      },
      {
        heading: 'Newsletter',
        text: 'If you sign up for our newsletter, we store your email address. You can unsubscribe at any time by clicking the unsubscribe link in the emails.',
      },
      {
        heading: 'Your rights',
        text: 'You have the right to request access, correction, or deletion of your personal data. Contact us via Instagram @dottyartwork or the contact form on the website.',
      },
      {
        heading: 'Cookies',
        text: 'We only use necessary cookies to manage shopping cart and session keys. No tracking purposes.',
      },
    ],
    lastUpdated: 'Last updated: January 2026',
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

        <div className="space-y-8">
          {t.sections.map((section, i) => (
            <section key={i}>
              <h2 className="text-xl font-semibold mb-3">{section.heading}</h2>
              <p className="text-muted-foreground">{section.text}</p>
            </section>
          ))}
        </div>

        <p className="text-sm text-muted-foreground mt-12 pt-8 border-t border-border">
          {t.lastUpdated}
        </p>
      </div>
    </div>
  );
}
