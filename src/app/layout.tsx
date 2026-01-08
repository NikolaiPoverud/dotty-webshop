import type { Metadata, Viewport } from "next";
import { Geologica } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/cart/cart-provider";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://dotty.no';

const geologica = Geologica({
  variable: "--font-geologica",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#FE206A',
};

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Dotty. | Pop-Art",
    template: "%s | Dotty.",
  },
  description: "Pop-art med personlighet. Unike kunstverk som bringer energi og farge til ditt hjem.",
  keywords: [
    "pop-art",
    "kunst",
    "original kunst",
    "kunsttrykk",
    "Dotty",
    "norsk kunst",
    "contemporary art",
    "kjøp kunst online",
    "pop art maleri",
    "moderne kunst",
  ],
  authors: [{ name: "Dotty." }],
  creator: "Dotty.",
  publisher: "Dotty.",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "nb_NO",
    alternateLocale: "en_US",
    siteName: "Dotty.",
    images: [{
      url: '/og-image.jpg',
      width: 1200,
      height: 630,
      alt: 'Dotty. Pop-Art',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    creator: '@dotty',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add your verification codes here when available
    // google: 'your-google-verification-code',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="no" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        {/* Preconnect to Supabase for faster data fetching */}
        <link rel="preconnect" href="https://qjnqwpbhxcnbfypvdwip.supabase.co" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://qjnqwpbhxcnbfypvdwip.supabase.co" />
      </head>
      <body
        className={`${geologica.variable} antialiased bg-background text-foreground`}
      >
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
