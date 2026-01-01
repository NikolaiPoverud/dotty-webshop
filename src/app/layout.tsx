import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/cart/cart-provider";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Dotty. | Pop-Art",
    template: "%s | Dotty.",
  },
  description: "Pop-art med personlighet. Unike kunstverk som bringer energi og farge til ditt hjem.",
  keywords: ["pop-art", "kunst", "original", "trykk", "Dotty", "Norway", "contemporary art"],
  authors: [{ name: "Dotty." }],
  openGraph: {
    type: "website",
    locale: "nb_NO",
    alternateLocale: "en_US",
    siteName: "Dotty.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning>
      <body
        className={`${spaceGrotesk.variable} ${inter.variable} antialiased bg-background text-foreground`}
      >
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
