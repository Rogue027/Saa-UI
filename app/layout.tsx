import type { Metadata } from 'next';
import { Inter, Manrope } from 'next/font/google';
import './globals.css';

const bodyFont = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

const displayFont = Manrope({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const metadataBase = process.env.NEXT_PUBLIC_SITE_URL
  ? new URL(process.env.NEXT_PUBLIC_SITE_URL)
  : undefined;

export const metadata: Metadata = {
  metadataBase,
  title: 'Veyit — Telegram commerce, automated',
  description: 'Sell digital products inside Telegram with automatic payment verification and instant delivery.',
  openGraph: {
    title: 'Veyit — Telegram commerce, automated',
    description: 'Order. Verify. Deliver. Run a digital-goods store inside Telegram.',
    type: 'website',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Veyit Telegram commerce flow' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Veyit — Telegram commerce, automated',
    description: 'Order. Verify. Deliver. Run a digital-goods store inside Telegram.',
    images: ['/og.png'],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${bodyFont.variable} ${displayFont.variable}`}>{children}</body>
    </html>
  );
}
