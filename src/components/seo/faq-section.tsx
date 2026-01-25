'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import type { Locale } from '@/types';

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqSectionProps {
  faqs: FaqItem[];
  locale: Locale;
  title?: string;
}

/**
 * FAQ Section Component
 *
 * Renders FAQs with accordion behavior and JSON-LD structured data
 * for improved SEO on programmatic facet pages.
 */
export function FaqSection({ faqs, locale, title }: FaqSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (faqs.length === 0) {
    return null;
  }

  const sectionTitle = title ?? (locale === 'no' ? 'Ofte stilte spørsmål' : 'Frequently Asked Questions');

  return (
    <section className="mt-12 pt-8 border-t border-white/10">
      <h2 className="text-2xl font-bold mb-6">{sectionTitle}</h2>

      {/* FAQ JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faqs.map((faq) => ({
              '@type': 'Question',
              name: faq.question,
              acceptedAnswer: {
                '@type': 'Answer',
                text: faq.answer,
              },
            })),
          }),
        }}
      />

      {/* FAQ Accordion */}
      <div className="space-y-3">
        {faqs.map((faq, index) => (
          <FaqItem
            key={index}
            faq={faq}
            isOpen={openIndex === index}
            onToggle={() => setOpenIndex(openIndex === index ? null : index)}
          />
        ))}
      </div>
    </section>
  );
}

interface FaqItemProps {
  faq: FaqItem;
  isOpen: boolean;
  onToggle: () => void;
}

function FaqItem({ faq, isOpen, onToggle }: FaqItemProps) {
  return (
    <div className="bg-white/5 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-4 py-4 text-left flex items-center justify-between hover:bg-white/5 transition-colors"
        aria-expanded={isOpen}
      >
        <span className="font-medium pr-4">{faq.question}</span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0"
        >
          <ChevronIcon />
        </motion.span>
      </button>

      <motion.div
        initial={false}
        animate={{
          height: isOpen ? 'auto' : 0,
          opacity: isOpen ? 1 : 0,
        }}
        transition={{ duration: 0.2 }}
        className="overflow-hidden"
      >
        <div className="px-4 pb-4 text-gray-300 leading-relaxed">
          {faq.answer}
        </div>
      </motion.div>
    </div>
  );
}

function ChevronIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

/**
 * Static FAQ Section (for server-rendered pages)
 * Doesn't use accordion, all FAQs visible
 */
export function FaqSectionStatic({ faqs, locale, title }: FaqSectionProps) {
  if (faqs.length === 0) {
    return null;
  }

  const sectionTitle = title ?? (locale === 'no' ? 'Ofte stilte spørsmål' : 'Frequently Asked Questions');

  return (
    <section className="mt-12 pt-8 border-t border-white/10">
      <h2 className="text-2xl font-bold mb-6">{sectionTitle}</h2>

      {/* FAQ JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faqs.map((faq) => ({
              '@type': 'Question',
              name: faq.question,
              acceptedAnswer: {
                '@type': 'Answer',
                text: faq.answer,
              },
            })),
          }),
        }}
      />

      {/* FAQ List */}
      <div className="space-y-6">
        {faqs.map((faq, index) => (
          <div key={index} className="bg-white/5 rounded-lg p-4">
            <h3 className="font-medium mb-2">{faq.question}</h3>
            <p className="text-gray-300 leading-relaxed">{faq.answer}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
