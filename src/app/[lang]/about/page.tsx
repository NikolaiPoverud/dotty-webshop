'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { use } from 'react';
import { Instagram, ArrowRight } from 'lucide-react';
import type { Locale } from '@/types';

const content = {
  no: {
    title: 'Om Dotty.',
    subtitle: 'Kunstneren bak kunsten',
    intro: 'Pop-art som utfordrer det vanlige og feirer det uventede. Hvert verk er en eksplosjon av farge og energi, skapt for å bringe glede og personlighet til ditt rom.',
    quote: '"Kunst skal ikke være stille. Den skal rope, danse, og få deg til å smile."',
    storyTitle: 'Min historie',
    storyText: 'Dotty startet som en lidenskap for å skape kunst som gjør folk glade. Inspirert av klassisk pop-art og moderne popkultur, blander jeg sterke farger med ikoniske motiver for å skape verk som er både nostalgiske og samtidige.',
    processTitle: 'Prosessen',
    processText: 'Hvert kunstverk starter som en idé — ofte inspirert av noe jeg ser i hverdagen, en film jeg elsker, eller et øyeblikk som fortjener å bli udødeliggjort. Jeg jobber primært med akryl på lerret, og lar fargene bygge seg opp lag for lag til det endelige uttrykket kommer til liv.',
    philosophyTitle: 'Min filosofi',
    philosophyText: 'Kunst skal ikke være utilgjengelig eller skremmende. Den skal være morsom, personlig, og noe du vil ha på veggen din fordi det gjør deg glad hver gang du ser på det. Jeg tror på kunst som feirer livet — med alle dets farger, kaos, og glede.',
    ctaTitle: 'Se kunsten',
    ctaText: 'Utforsk samlingen og finn ditt nye favorittkunstverk.',
    ctaButton: 'Gå til shop',
    followMe: 'Følg meg på Instagram',
  },
  en: {
    title: 'About Dotty.',
    subtitle: 'The artist behind the art',
    intro: 'Pop-art that challenges the ordinary and celebrates the unexpected. Each piece is an explosion of color and energy, created to bring joy and personality to your space.',
    quote: '"Art should not be quiet. It should shout, dance, and make you smile."',
    storyTitle: 'My story',
    storyText: 'Dotty started as a passion for creating art that makes people happy. Inspired by classic pop-art and modern pop culture, I blend bold colors with iconic imagery to create works that are both nostalgic and contemporary.',
    processTitle: 'The process',
    processText: 'Every artwork starts as an idea — often inspired by something I see in everyday life, a movie I love, or a moment that deserves to be immortalized. I work primarily with acrylic on canvas, letting the colors build up layer by layer until the final expression comes to life.',
    philosophyTitle: 'My philosophy',
    philosophyText: 'Art should not be inaccessible or intimidating. It should be fun, personal, and something you want on your wall because it makes you happy every time you look at it. I believe in art that celebrates life — with all its colors, chaos, and joy.',
    ctaTitle: 'See the art',
    ctaText: 'Explore the collection and find your new favorite piece.',
    ctaButton: 'Go to shop',
    followMe: 'Follow me on Instagram',
  },
};

export default function AboutPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = use(params);
  const locale = lang as Locale;
  const t = content[locale];

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl sm:text-6xl font-bold mb-4">
            <span className="gradient-text">{t.title}</span>
          </h1>
          <p className="text-xl text-muted-foreground">{t.subtitle}</p>
        </motion.div>

        {/* Artist Image + Intro */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid md:grid-cols-2 gap-8 mb-16"
        >
          <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
            <Image
              src="/artist.jpg"
              alt="Dotty - Artist"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-primary/10" />
          </div>
          <div className="flex flex-col justify-center">
            <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
              {t.intro}
            </p>
            <blockquote className="pl-6 border-l-4 border-primary">
              <p className="text-xl font-medium italic">{t.quote}</p>
              <footer className="mt-3 text-primary font-semibold">— Dotty</footer>
            </blockquote>
          </div>
        </motion.div>

        {/* Story Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold mb-4">{t.storyTitle}</h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            {t.storyText}
          </p>
        </motion.section>

        {/* Process Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold mb-4">{t.processTitle}</h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            {t.processText}
          </p>
        </motion.section>

        {/* Philosophy Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold mb-4">{t.philosophyTitle}</h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            {t.philosophyText}
          </p>
        </motion.section>

        {/* Decorative dots */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex justify-center gap-2 mb-16"
        >
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="w-3 h-3 rounded-full bg-primary"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.6 + i * 0.1 }}
            />
          ))}
        </motion.div>

        {/* CTA Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
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

        {/* Instagram Link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-center"
        >
          <a
            href="https://instagram.com/dottyartwork"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
          >
            <Instagram className="w-5 h-5" />
            {t.followMe}
          </a>
        </motion.div>
      </div>
    </div>
  );
}
