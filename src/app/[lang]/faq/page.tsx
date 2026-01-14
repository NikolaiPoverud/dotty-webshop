'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { use, useState, useEffect } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import type { Dictionary, Locale } from '@/types';

interface FAQ {
  question: string;
  answer: string;
}

const faqs: Record<Locale, FAQ[]> = {
  no: [
    {
      question: 'Hvordan sendes kunstverk?',
      answer: 'Originale malerier pakkes forsiktig i beskyttende materiale og sendes i spesialbygde kunstkasser eller rør avhengig av størrelse. Trykk sendes i syrefrie hylser eller flat emballasje. Alle forsendelser er forsikret.',
    },
    {
      question: 'Hva er leveringstiden?',
      answer: 'Originale kunstverk sendes vanligvis innen 3-5 virkedager. Du vil motta en e-post med sporingsinformasjon når kunstverket er sendt. Leveringstid varierer basert på destinasjon.',
    },
    {
      question: 'Kommer kunstverket innrammet?',
      answer: 'Originale malerier på lerret selges uten ramme – de er malt på galleridype rammer og er klare til å henges direkte på veggen. Trykk selges uten ramme slik at du kan velge ramme som passer din stil og interiør.',
    },
    {
      question: 'Hvordan bør jeg ta vare på kunstverket?',
      answer: 'Unngå direkte sollys for å bevare fargenes intensitet. Originale akrylmalerier kan forsiktig tørkes med en myk, tørr klut. Trykk bør rammes inn med UV-beskyttende glass for best holdbarhet.',
    },
    {
      question: 'Kan jeg returnere et kunstverk?',
      answer: 'Ja, du har 14 dagers angrerett på alle kjøp i henhold til norsk forbrukerkjøpslov. Kunstverket må returneres i original emballasje og i samme stand som mottatt. Kontakt oss for returinstruksjoner.',
    },
    {
      question: 'Hva er kunsteravgiften?',
      answer: 'Kunsteravgift (5%) er en lovpålagt avgift på salg av kunst over 2500 kr i Norge. Avgiften går til Bildende Kunstneres Hjelpefond som støtter norske kunstnere. Den legges automatisk til ved utsjekk.',
    },
    {
      question: 'Tilbyr dere tilpassede bestillinger?',
      answer: 'Ja! Jeg elsker å skape tilpassede verk. Kontakt meg via kontaktskjemaet på forsiden for å diskutere din idé, og vi kan snakke om størrelse, farger og pris.',
    },
    {
      question: 'Hvordan vet jeg at kunstverket passer på veggen min?',
      answer: 'Alle kunstverk har detaljerte mål oppgitt. Et tips: klipp ut en papirbit i samme størrelse og fest den på veggen for å visualisere hvordan kunstverket vil se ut i rommet ditt.',
    },
    {
      question: 'Hvilke betalingsmetoder aksepteres?',
      answer: 'Vi aksepterer alle vanlige betalingskort (Visa, Mastercard) via Stripe. Betalingen er sikker og kryptert.',
    },
    {
      question: 'Sender dere internasjonalt?',
      answer: 'Ja, vi sender til de fleste land. Fraktkostnader varierer basert på størrelse og destinasjon. Merk at toll og avgifter kan tilkomme for bestillinger utenfor Norge/EU.',
    },
  ],
  en: [
    {
      question: 'How is artwork shipped?',
      answer: 'Original paintings are carefully packaged in protective materials and shipped in custom-built art crates or tubes depending on size. Prints are shipped in acid-free tubes or flat packaging. All shipments are insured.',
    },
    {
      question: 'What is the delivery time?',
      answer: 'Original artworks typically ship within 3-5 business days. You will receive an email with tracking information when your artwork is shipped. Delivery time varies based on destination.',
    },
    {
      question: 'Does the artwork come framed?',
      answer: 'Original canvas paintings are sold unframed – they are painted on gallery-depth frames and are ready to hang directly on the wall. Prints are sold unframed so you can choose a frame that matches your style and interior.',
    },
    {
      question: 'How should I care for the artwork?',
      answer: 'Avoid direct sunlight to preserve color intensity. Original acrylic paintings can be gently wiped with a soft, dry cloth. Prints should be framed with UV-protective glass for best longevity.',
    },
    {
      question: 'Can I return an artwork?',
      answer: 'Yes, you have a 14-day return policy on all purchases. The artwork must be returned in original packaging and in the same condition as received. Contact us for return instructions.',
    },
    {
      question: 'What is the artist levy?',
      answer: 'Artist levy (5%) is a mandatory fee on art sales over 2500 NOK in Norway. The fee goes to the Visual Artists\' Relief Fund which supports Norwegian artists. It is automatically added at checkout.',
    },
    {
      question: 'Do you offer custom orders?',
      answer: 'Yes! I love creating custom pieces. Contact me via the contact form on the homepage to discuss your idea, and we can talk about size, colors, and pricing.',
    },
    {
      question: 'How do I know the artwork will fit my wall?',
      answer: 'All artworks have detailed dimensions listed. A tip: cut out a piece of paper in the same size and attach it to your wall to visualize how the artwork will look in your space.',
    },
    {
      question: 'What payment methods are accepted?',
      answer: 'We accept all major credit cards (Visa, Mastercard) via Stripe. Payment is secure and encrypted.',
    },
    {
      question: 'Do you ship internationally?',
      answer: 'Yes, we ship to most countries. Shipping costs vary based on size and destination. Note that customs and duties may apply for orders outside Norway/EU.',
    },
  ],
};

// Note: This is a client component - dictionary will be fetched via useEffect
// For now, keeping the static text for FAQ page content which is different from other pages
const pageText = {
  no: {
    title: 'Ofte stilte spørsmål',
    subtitle: 'Alt du trenger å vite om kjøp av kunst fra Dotty.',
    moreQuestions: 'Har du flere spørsmål?',
    contact: 'Ta kontakt',
  },
  en: {
    title: 'Frequently Asked Questions',
    subtitle: 'Everything you need to know about buying art from Dotty.',
    moreQuestions: 'Have more questions?',
    contact: 'Get in touch',
  },
};

function FAQItem({ faq, index }: { faq: FAQ; index: number }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="border-b border-border"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-5 flex items-center justify-between text-left hover:text-primary transition-colors"
      >
        <span className="font-medium pr-4">{faq.question}</span>
        <ChevronDown
          className={`w-5 h-5 flex-shrink-0 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-muted-foreground leading-relaxed">
              {faq.answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function FAQPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = use(params);
  const locale = lang as Locale;
  const t = pageText[locale];
  const faqList = faqs[locale];

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
            <HelpCircle className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            <span className="gradient-text">{t.title}</span>
          </h1>
          <p className="text-lg text-muted-foreground">{t.subtitle}</p>
        </motion.div>

        {/* FAQ List */}
        <div className="mb-12">
          {faqList.map((faq, index) => (
            <FAQItem key={index} faq={faq} index={index} />
          ))}
        </div>

        {/* Contact CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center bg-muted rounded-lg p-8"
        >
          <p className="text-lg mb-4">{t.moreQuestions}</p>
          <Link
            href={`/${locale}#contact`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-background font-medium rounded-lg hover:bg-primary-light transition-colors"
          >
            {t.contact}
          </Link>
        </motion.div>

        {/* Decorative dots */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex justify-center gap-2 mt-12"
        >
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="w-3 h-3 rounded-full bg-primary"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.7 + i * 0.1 }}
            />
          ))}
        </motion.div>
      </div>
    </div>
  );
}
