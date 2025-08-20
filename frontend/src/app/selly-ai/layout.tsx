import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SELLY AI Assistant | Dinas Kependudukan dan Pencatatan Sipil Kabupaten Garut',
  description: 'SELLY adalah AI Assistant yang dirancang khusus untuk membantu pelayanan administrasi kependudukan di Kabupaten Garut dengan kemampuan bahasa Indonesia yang natural dan akses data real-time.',
  keywords: [
    'SELLY',
    'AI Assistant',
    'Chatbot',
    'Dinas Kependudukan',
    'Pencatatan Sipil',
    'Kabupaten Garut',
    'Administrasi',
    'Pelayanan Publik',
    'Indonesia',
    'KTP',
    'Akta Kelahiran',
    'Kartu Keluarga'
  ],
  authors: [{ name: 'Dinas Kependudukan dan Pencatatan Sipil Kabupaten Garut' }],
  creator: 'Dinas Kependudukan dan Pencatatan Sipil Kabupaten Garut',
  publisher: 'Dinas Kependudukan dan Pencatatan Sipil Kabupaten Garut',
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
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: '/selly-ai',
    title: 'SELLY AI Assistant - Pelayanan Administrasi Kependudukan Garut',
    description: 'AI Assistant untuk membantu pelayanan administrasi kependudukan dengan kemampuan bahasa Indonesia yang natural dan akses data real-time.',
    siteName: 'SELLICA - Sistem Elektronik Layanan Administrasi',
    images: [
      {
        url: '/images/selly-og-image.png',
        width: 1200,
        height: 630,
        alt: 'SELLY AI Assistant - Dinas Kependudukan Kabupaten Garut',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SELLY AI Assistant - Pelayanan Administrasi Kependudukan Garut',
    description: 'AI Assistant untuk membantu pelayanan administrasi kependudukan dengan kemampuan bahasa Indonesia yang natural.',
    images: ['/images/selly-twitter-image.png'],
    creator: '@disdukcapilgarut',
  },
  alternates: {
    canonical: '/selly-ai',
    languages: {
      'id-ID': '/selly-ai',
    },
  },
  category: 'Government Services',
  classification: 'Public Service',
  other: {
    'application-name': 'SELLY AI Assistant',
    'mobile-web-app-capable': 'yes',
    'mobile-web-app-status-bar-style': 'default',
    'mobile-web-app-title': 'SELLY AI',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'SELLY AI',
    'format-detection': 'telephone=no',
    'theme-color': '#3B82F6',
    'color-scheme': 'light dark',
  },
};

interface SellyAILayoutProps {
  children: React.ReactNode;
}

/**
 * Layout for SELLY AI Assistant page
 * Provides proper metadata, SEO optimization, and accessibility features
 */
export default function SellyAILayout({ children }: SellyAILayoutProps) {
  return (
    <>
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: 'SELLY AI Assistant',
            description: 'AI Assistant untuk pelayanan administrasi kependudukan Kabupaten Garut',
            url: '/selly-ai',
            applicationCategory: 'GovernmentApplication',
            operatingSystem: 'Web Browser',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'IDR',
            },
            provider: {
              '@type': 'GovernmentOrganization',
              name: 'Dinas Kependudukan dan Pencatatan Sipil Kabupaten Garut',
              address: {
                '@type': 'PostalAddress',
                addressLocality: 'Garut',
                addressRegion: 'Jawa Barat',
                addressCountry: 'Indonesia',
              },
            },
            featureList: [
              'Pencarian data administrasi kependudukan',
              'Bantuan prosedur pelayanan',
              'Informasi persyaratan dokumen',
              'Konsultasi layanan publik',
              'Dukungan bahasa Indonesia natural',
            ],
            screenshot: '/images/selly-screenshot.png',
            softwareVersion: '2.0',
            dateModified: new Date().toISOString(),
            inLanguage: 'id-ID',
            isAccessibleForFree: true,
            accessibilityFeature: [
              'alternativeText',
              'captions',
              'structuralNavigation',
              'readingOrder',
              'tableOfContents',
            ],
            accessibilityHazard: 'none',
            accessibilityControl: [
              'fullKeyboardControl',
              'fullMouseControl',
              'fullTouchControl',
            ],
          }),
        }}
      />

      {/* Additional meta tags for mobile optimization */}
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes" />
      <meta name="format-detection" content="telephone=no" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="SELLY AI" />
      
      {/* Preconnect to external domains for performance */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      
      {/* Favicon and app icons */}
      <link rel="icon" href="/favicon.ico" sizes="any" />
      <link rel="icon" href="/icon.svg" type="image/svg+xml" />
      <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      <link rel="manifest" href="/manifest.json" />

      {children}
    </>
  );
}
