import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://draftroomfe.vercel.app'),
  title: {
    default: 'DraftRoom - Community NFL Draft Scouting',
    template: '%s | DraftRoom'
  },
  description: 'Community-driven NFL Draft scouting platform featuring expert analysis, community insights, and Big Board rankings. Scout prospects, share your takes, and build your draft board.',
  keywords: [
    'NFL Draft',
    'Draft Scouting',
    'NFL Prospects',
    'Draft Board',
    'Football Scouting',
    'NFL Draft 2026',
    'Draft Analysis',
    'Community Scouting',
    'Draft Rankings',
    'NFL Mock Draft'
  ],
  authors: [{ name: 'BucsJuice', url: 'https://x.com/BucsJuice' }],
  creator: 'BucsJuice',
  publisher: 'DraftRoom',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://draftroomfe.vercel.app',
    siteName: 'DraftRoom',
    title: 'DraftRoom - Community NFL Draft Scouting',
    description: 'Community-driven NFL Draft scouting platform featuring expert analysis, community insights, and Big Board rankings.',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'DraftRoom - Community NFL Draft Scouting',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DraftRoom - Community NFL Draft Scouting',
    description: 'Scout prospects, share your takes, and build your draft board with expert analysis and community insights.',
    creator: '@BucsJuice',
    images: ['/twitter-image'],
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
  icons: {
    icon: '/icon',
    apple: '/apple-icon',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  )
}
