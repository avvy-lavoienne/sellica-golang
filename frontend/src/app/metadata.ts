import { Metadata } from "next"

const siteConfig = {
  name: "SELLICA",
  title: "SELLICA - Sistem Elektronik Layanan Catatan Sipil",
  description: "Platform digital terintegrasi untuk pengelolaan data catatan sipil yang aman, efisien, dan mudah diakses. Tingkatkan produktivitas dengan teknologi terdepan.",
  url: "https://sellica.id",
  ogImage: "/images/og-image.jpg",
  keywords: [
    "catatan sipil",
    "sistem elektronik",
    "digitalisasi pemerintah",
    "e-government",
    "layanan publik",
    "data management",
    "keamanan data",
    "dashboard analytics",
    "pengaduan elektronik",
    "SELLICA"
  ],
}

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  authors: [
    {
      name: "SELLICA Team",
      url: siteConfig.url,
    },
  ],
  creator: "SELLICA",
  publisher: "SELLICA",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: siteConfig.url,
    title: siteConfig.title,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: siteConfig.title,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
    creator: "@sellica_id",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  verification: {
    google: "your-google-verification-code",
    yandex: "your-yandex-verification-code",
  },
  alternates: {
    canonical: siteConfig.url,
    languages: {
      "id-ID": siteConfig.url,
      "en-US": `${siteConfig.url}/en`,
    },
  },
  category: "technology",
}

// Structured data for the landing page
export const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: siteConfig.name,
  description: siteConfig.description,
  url: siteConfig.url,
  applicationCategory: "GovernmentApplication",
  operatingSystem: "Web Browser",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "IDR",
    availability: "https://schema.org/InStock",
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.8",
    ratingCount: "150",
    bestRating: "5",
    worstRating: "1",
  },
  author: {
    "@type": "Organization",
    name: "SELLICA Team",
    url: siteConfig.url,
  },
  publisher: {
    "@type": "Organization",
    name: siteConfig.name,
    logo: {
      "@type": "ImageObject",
      url: `${siteConfig.url}/images/logo-pemda.jpeg`,
    },
  },
  screenshot: {
    "@type": "ImageObject",
    url: siteConfig.ogImage,
  },
  featureList: [
    "Dashboard Terintegrasi",
    "Pengaduan Elektronik", 
    "Rekam Data Aman",
    "Keamanan Berlapis",
    "Performa Tinggi",
    "Standar Internasional"
  ],
}

// Organization structured data
export const organizationStructuredData = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: siteConfig.name,
  url: siteConfig.url,
  logo: `${siteConfig.url}/images/logo-pemda.jpeg`,
  description: siteConfig.description,
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+62-21-1234-5678",
    contactType: "customer service",
    availableLanguage: ["Indonesian", "English"],
  },
  sameAs: [
    "https://twitter.com/sellica_id",
    "https://linkedin.com/company/sellica",
    "https://github.com/sellica",
  ],
}

// Website structured data
export const websiteStructuredData = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: siteConfig.name,
  url: siteConfig.url,
  description: siteConfig.description,
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${siteConfig.url}/search?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
}

export { siteConfig }
