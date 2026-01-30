'use client';

import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { use } from 'react';
import { SiInstagram, SiTiktok } from '@icons-pack/react-simple-icons';

import type { Locale } from '@/types';

const content = {
  no: {
    greeting: 'Velkommen til mitt lille kunstunivers!',
    intro: 'Her deler jeg malerier og prints som er til salgs.',
    paragraphs: [
      'Illustrasjonene er lekende og tar for seg både realistiske og urealistiske motiver. Jeg foretrekker å skape bilder med sterke farger og en tydelig strek som gjør seg synlig i rommet.',
      'Her finner du også bilder med en dypere mening. Gjennom Dotty. uttrykker jeg som oftest det overfladiske og positive i livet, men jeg finner likevel mye inspirasjon i å formidle sårbarhet og virkelighet.',
      'Dotty. startet som et ønske om å skape og dele kunst med omverdenen. Jeg startet prosjektet i 2022, og siden har kunsten min funnet veien inn i mange hjem.',
    ],
    highlight: 'Kunsten er for deg som ser etter et blikkfang, noe gøy på veggen og gjerne et bilde med litt personlighet.',
    ctaText: 'Utforsk samlingen',
    ctaButton: 'Se kunsten',
  },
  en: {
    greeting: 'Welcome to my little art universe!',
    intro: 'Here I share paintings and prints that are for sale.',
    paragraphs: [
      'The illustrations are playful and cover both realistic and unrealistic subjects. I prefer to create images with bold colors and a distinct line that makes a statement in the room.',
      'Here you will also find images with a deeper meaning. Through Dotty. I mostly express the superficial and positive aspects of life, but I also find much inspiration in conveying vulnerability and reality.',
      'Dotty. started as a desire to create and share art with the world. I started the project in 2022, and since then my art has found its way into many homes.',
    ],
    highlight: 'The art is for you who are looking for an eye-catcher, something fun on the wall, and preferably a picture with a bit of personality.',
    ctaText: 'Explore the collection',
    ctaButton: 'See the art',
  },
} as const;

const SOCIAL_LINKS = [
  { href: 'https://instagram.com/dottyartwork', icon: SiInstagram, label: '@dottyartwork' },
  { href: 'https://tiktok.com/@dottyartwork', icon: SiTiktok, label: '@dottyartwork' },
] as const;

export default function AboutPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}): React.ReactElement {
  const { lang } = use(params);
  const locale = lang as Locale;
  const t = content[locale];

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-5xl mx-auto px-6">
        {/* Hero with image */}
        <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center mb-16 md:mb-24">
          {/* Text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="order-2 md:order-1"
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground leading-tight mb-4">
              {t.greeting}
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed">
              {t.intro}
            </p>
          </motion.div>

          {/* Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="order-1 md:order-2"
          >
            <div className="relative aspect-[4/5] rounded-lg overflow-hidden bg-muted">
              <Image
                src="/artist.jpg"
                alt="Dotty - Artist"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            </div>
          </motion.div>
        </div>

        {/* Main content */}
        <div className="max-w-2xl mx-auto">
          <div className="space-y-6 mb-12">
            {t.paragraphs.map((paragraph, index) => (
              <motion.p
                key={index}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{
                  duration: 0.6,
                  delay: index * 0.08,
                  ease: [0.22, 1, 0.36, 1]
                }}
                className="text-lg text-muted-foreground leading-relaxed"
              >
                {paragraph}
              </motion.p>
            ))}
          </div>

          {/* Highlight */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="border-l-4 border-primary pl-6 py-2 mb-16"
          >
            <p className="text-lg sm:text-xl font-medium text-foreground leading-relaxed italic">
              {t.highlight}
            </p>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex flex-col sm:flex-row items-center gap-5 mb-16"
          >
            <p className="text-muted-foreground">{t.ctaText}</p>
            <Link
              href={`/${locale}/shop`}
              className="group inline-flex items-center gap-2 px-6 py-3 bg-primary text-background font-semibold hover:bg-primary-light transition-colors"
            >
              {t.ctaButton}
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>

          {/* Social */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="pt-8 border-t border-muted/50 flex justify-center gap-6"
          >
            {SOCIAL_LINKS.map(({ href, icon: Icon, label }) => (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm">{label}</span>
              </a>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
