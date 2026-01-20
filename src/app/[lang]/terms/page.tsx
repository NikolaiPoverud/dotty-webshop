import type { Metadata } from 'next';
import type { Locale } from '@/types';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://dotty.no';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const isNorwegian = lang === 'no';

  const title = isNorwegian ? 'Vilkår' : 'Terms & Conditions';
  const description = isNorwegian
    ? 'Les våre kjøpsvilkår for handel hos Dotty. - priser, betaling, levering, angrerett og reklamasjon.'
    : 'Read our terms and conditions for shopping at Dotty. - prices, payment, delivery, returns and complaints.';

  return {
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/${lang}/terms`,
      languages: {
        'nb-NO': `${BASE_URL}/no/terms`,
        'en': `${BASE_URL}/en/terms`,
      },
    },
  };
}

const content = {
  no: {
    title: 'Vilkår',
    intro: 'Ved å handle hos Dotty. aksepterer du følgende kjøpsvilkår.',
    sections: [
      {
        heading: 'Selger',
        text: 'Dotty. | Org.nr: 829736322 | E-post: hei@dotty.no',
      },
      {
        heading: 'Priser og betaling',
        text: 'Alle priser er oppgitt i norske kroner (NOK) og inkluderer 25% MVA. Betaling skjer via Stripe (kort) eller Vipps. Ordren bekreftes når betalingen er godkjent.',
      },
      {
        heading: 'Originaler vs. trykk',
        text: 'Originaler er unike kunstverk som kun finnes i ett eksemplar. Trykk er høykvalitets reproduksjoner i begrenset opplag. Produkttypen er tydelig merket på hver vare.',
      },
      {
        heading: 'Levering',
        text: 'Vi sender til hele Norge og utvalgte land i Europa. Originaler sendes forsikret med sporing. Leveringstid er normalt 3-7 virkedager innenlands, 5-14 virkedager internasjonalt. Du mottar sporingsinformasjon på e-post når ordren sendes.',
      },
      {
        heading: 'Angrerett',
        text: 'Du har 14 dagers angrerett i henhold til angrerettloven. Fristen løper fra du mottar varen. Varen må returneres i uåpnet/uskadet originalemballasje. Kontakt oss på hei@dotty.no for returinstruksjoner. Kunden dekker returfrakt. Last ned standard angrerettskjema fra Forbrukertilsynet: forbrukertilsynet.no/angrerettskjema',
      },
      {
        heading: 'Reklamasjon',
        text: 'Ved skade under transport, kontakt oss innen 24 timer med bilder av skaden. Vi erstatter eller refunderer skadet vare. Reklamasjonsretten gjelder i 2 år etter kjøpsloven.',
      },
      {
        heading: 'Opphavsrett',
        text: 'Alle kunstverk er beskyttet av opphavsrett. Ved kjøp får du rett til å eie og vise verket privat. Kommersiell bruk eller reproduksjon er ikke tillatt uten skriftlig samtykke.',
      },
    ],
    lastUpdated: 'Sist oppdatert: Januar 2026',
  },
  en: {
    title: 'Terms & Conditions',
    intro: 'By shopping at Dotty. you accept the following terms and conditions.',
    sections: [
      {
        heading: 'Seller',
        text: 'Dotty. | Org.nr: 829736322 | Email: hei@dotty.no',
      },
      {
        heading: 'Prices and payment',
        text: 'All prices are in Norwegian kroner (NOK) and include 25% VAT. Payment is made via Stripe (card) or Vipps. The order is confirmed when payment is approved.',
      },
      {
        heading: 'Originals vs. prints',
        text: 'Originals are unique artworks that exist in only one copy. Prints are high-quality reproductions in limited editions. The product type is clearly marked on each item.',
      },
      {
        heading: 'Delivery',
        text: 'We ship throughout Norway and selected European countries. Originals are sent insured with tracking. Delivery time is normally 3-7 business days domestically, 5-14 business days internationally. You will receive tracking information by email when the order is shipped.',
      },
      {
        heading: 'Right of withdrawal',
        text: 'You have a 14-day right of withdrawal according to Norwegian consumer law. The period starts when you receive the item. The item must be returned in unopened/undamaged original packaging. Contact us at hei@dotty.no for return instructions. The customer covers return shipping.',
      },
      {
        heading: 'Complaints',
        text: 'In case of damage during transport, contact us within 24 hours with photos of the damage. We will replace or refund damaged goods. The right to complain applies for 2 years.',
      },
      {
        heading: 'Copyright',
        text: 'All artworks are protected by copyright. Upon purchase, you acquire the right to own and display the work privately. Commercial use or reproduction is not permitted without written consent.',
      },
    ],
    lastUpdated: 'Last updated: January 2026',
  },
};

export default async function TermsPage({
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
