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
    title: 'Om Dotty.',
    subtitle: 'Kunstneren bak kunsten',
    intro: 'Velkommen til mitt lille kunstunivers! Her deler jeg malerier og prints som er til salgs.',
    paragraphs: [
      'Illustrasjonene er lekende og tar for seg både realistiske og urealistiske motiver. Jeg foretrekker å skape bilder med sterke farger og en tydelig strek som gjør seg synlig i rommet.',
      'Her finner du også bilder med en dypere mening. Gjennom Dotty. uttrykker jeg som oftest det overfladiske og positive i livet, men jeg finner likevel mye inspirasjon i å formidle sårbarhet og virkelighet.',
      'Dotty. startet som et ønske om å skape og dele kunst med omverdenen. Jeg startet prosjektet i 2022, og siden har kunsten min funnet veien inn i mange hjem.',
      'Kunsten er for deg som ser etter et blikkfang, noe gøy på veggen og gjerne et bilde med litt personlighet.',
    ],
    ctaTitle: 'Se kunsten',
    ctaText: 'Utforsk samlingen og finn ditt nye favorittkunstverk.',
    ctaButton: 'Gå til shop',
  },
  en: {
    title: 'About Dotty.',
    subtitle: 'The artist behind the art',
    intro: 'Welcome to my little art universe! Here I share paintings and prints that are for sale.',
    paragraphs: [
      'The illustrations are playful and cover both realistic and unrealistic subjects. I prefer to create images with bold colors and a distinct line that makes a statement in the room.',
      'Here you will also find images with a deeper meaning. Through Dotty. I mostly express the superficial and positive aspects of life, but I also find much inspiration in conveying vulnerability and reality.',
      'Dotty. started as a desire to create and share art with the world. I started the project in 2022, and since then my art has found its way into many homes.',
      'The art is for you who are looking for an eye-catcher, something fun on the wall, and preferably a picture with a bit of personality.',
    ],
    ctaTitle: 'See the art',
    ctaText: 'Explore the collection and find your new favorite piece.',
    ctaButton: 'Go to shop',
  },
} as const;

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const SOCIAL_LINKS = [
  { href: 'https://instagram.com/dottyartwork', icon: SiInstagram, label: '@dottyartwork' },
  { href: 'https://tiktok.com/@dottyartwork', icon: SiTiktok, label: '@dottyartwork' },
] as const;

function DecorativeDots(): React.ReactElement {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="flex justify-center gap-2 mb-16"
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <motion.div
          key={i}
          className="w-3 h-3 rounded-full bg-primary"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.6 + i * 0.1 }}
        />
      ))}
    </motion.div>
  );
}

function SocialLinks(): React.ReactElement {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.7 }}
      className="flex justify-center gap-4"
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
          {label}
        </a>
      ))}
    </motion.div>
  );
}

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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={fadeInUp.initial}
          animate={fadeInUp.animate}
          className="text-center mb-16"
        >
          <h1 className="text-5xl sm:text-6xl font-bold mb-4">
            <span className="gradient-text">{t.title}</span>
          </h1>
          <p className="text-xl text-muted-foreground">{t.subtitle}</p>
        </motion.div>

        <motion.div
          initial={fadeInUp.initial}
          animate={fadeInUp.animate}
          transition={{ delay: 0.1 }}
          className="mb-16"
        >
          {/* Mobile: stacked layout */}
          <div className="md:hidden space-y-8">
            <div className="relative aspect-square rounded-lg overflow-hidden bg-muted max-w-sm mx-auto">
              <Image
                src="/artist.jpg"
                alt="Dotty - Artist"
                fill
                className="object-cover"
                sizes="100vw"
              />
              <div className="absolute inset-0 bg-primary/10" />
            </div>
            <div>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {t.intro}
              </p>
            </div>
          </div>

          {/* Desktop: text left, image centered between text and edge */}
          <div className="hidden md:grid md:grid-cols-2 gap-12 items-center">
            <div className="flex flex-col justify-center">
              <p className="text-lg text-muted-foreground leading-relaxed">
                {t.intro}
              </p>
            </div>
            <div className="flex justify-center">
              <div className="relative aspect-square w-full max-w-md rounded-lg overflow-hidden bg-muted">
                <Image
                  src="/artist.jpg"
                  alt="Dotty - Artist"
                  fill
                  className="object-cover"
                  sizes="50vw"
                />
                <div className="absolute inset-0 bg-primary/10" />
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={fadeInUp.initial}
          animate={fadeInUp.animate}
          transition={{ delay: 0.2 }}
          className="space-y-6 mb-16"
        >
          {t.paragraphs.map((paragraph, index) => (
            <p key={index} className="text-lg text-muted-foreground leading-relaxed">
              {paragraph}
            </p>
          ))}
        </motion.div>

        <DecorativeDots />

        <motion.section
          initial={fadeInUp.initial}
          animate={fadeInUp.animate}
          transition={{ delay: 0.6 }}
          className="text-center bg-muted rounded-lg p-8 mb-8"
        >
          <h2 className="text-2xl font-bold mb-2">{t.ctaTitle}</h2>
          <p className="text-muted-foreground mb-6">{t.ctaText}</p>
          <Link
            href={`/${locale}/shop`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-background font-medium rounded-lg hover:bg-primary-light transition-colors"
          >
            {t.ctaButton}
            <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.section>

        <SocialLinks />
      </div>
    </div>
  );
}
