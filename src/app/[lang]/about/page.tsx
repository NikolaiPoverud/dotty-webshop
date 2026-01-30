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
    <div className="min-h-screen">
      {/* Hero section with image */}
      <section className="relative h-[60vh] sm:h-[70vh] flex items-end">
        <div className="absolute inset-0">
          <Image
            src="/artist.jpg"
            alt="Dotty - Artist"
            fill
            className="object-cover object-top"
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        </div>

        <div className="relative z-10 w-full max-w-3xl mx-auto px-6 pb-12 sm:pb-16">
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground leading-tight"
          >
            {t.greeting}
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="mt-4 text-xl sm:text-2xl text-muted-foreground"
          >
            {t.intro}
          </motion.p>
        </div>
      </section>

      {/* Main content */}
      <section className="max-w-2xl mx-auto px-6 py-16 sm:py-24">
        <div className="space-y-8">
          {t.paragraphs.map((paragraph, index) => (
            <motion.p
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{
                duration: 0.7,
                delay: index * 0.1,
                ease: [0.22, 1, 0.36, 1]
              }}
              className="text-lg sm:text-xl text-muted-foreground leading-relaxed"
            >
              {paragraph}
            </motion.p>
          ))}
        </div>

        {/* Highlight quote */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="my-16 sm:my-20 py-8 border-l-4 border-primary pl-6 sm:pl-8"
        >
          <p className="text-xl sm:text-2xl font-medium text-foreground leading-relaxed italic">
            {t.highlight}
          </p>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8"
        >
          <p className="text-muted-foreground text-lg">{t.ctaText}</p>
          <Link
            href={`/${locale}/shop`}
            className="group inline-flex items-center gap-3 px-8 py-4 bg-primary text-background font-semibold text-lg hover:bg-primary-light transition-all duration-300"
          >
            {t.ctaButton}
            <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </motion.div>

        {/* Social links */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-16 pt-8 border-t border-muted flex justify-center gap-6"
        >
          {SOCIAL_LINKS.map(({ href, icon: Icon, label }) => (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors duration-300"
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm">{label}</span>
            </a>
          ))}
        </motion.div>
      </section>
    </div>
  );
}
