import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'DofinityCI',
  description: 'Your information can now talk back',
  openGraph: {
    title: 'DofinityCI',
    description: 'Your information can now talk back',
    type: 'website',
    locale: 'en_US',
    siteName: 'DofinityCI',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en-US">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <link rel="icon" href="/assets/favicon32.png" sizes="32x32" />
        <link rel="icon" href="/assets/favicon192.png" sizes="192x192" />
        <link rel="apple-touch-icon" href="/assets/favicon180.png" />
        <meta name="msapplication-TileImage" content="/assets/favicon270.png" />
      </head>
      <body className="home page-template page-template-templates page-template-home-page page-template-templateshome-page-php page">
        <div id="page" className="site">
          {children}
        </div>
      </body>
    </html>
  )
}