import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import NextTopLoader from "nextjs-toploader"
import { ThemeProvider } from "@/components/ThemeProvider"
import { ApiInterceptorProvider } from "@/components/ApiInterceptorProvider"
import {
  metadata as siteMetadata,
  structuredData,
  organizationStructuredData,
  websiteStructuredData,
} from "./metadata";
import "@/css/global.css";

// Phase 3: Server-side initialization for Cache Warming Optimization
import { initializeServerForNextJS } from "@/lib/startup/ServerInitializer";

// Phase 3: React Query for Advanced Caching
import { QueryProvider } from "@/components/QueryProvider";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-inter",
});

// Use the enhanced metadata from metadata.ts
export const metadata: Metadata = siteMetadata;

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Initialize server-side services for Phase 3 Cache Warming Optimization
  await initializeServerForNextJS();

  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationStructuredData),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteStructuredData),
          }}
        />

        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />

        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body
        className={`${inter.variable} font-sans antialiased`}
        suppressHydrationWarning={true}
      >
        {/* Skip navigation link for keyboard/screen-reader users */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:shadow-lg"
        >
          Langsung ke konten utama
        </a>
        <ApiInterceptorProvider>
          <QueryProvider>
            <ThemeProvider defaultTheme="system">
              <NextTopLoader
                color="hsl(var(--primary))"
                initialPosition={0.08}
                crawlSpeed={200}
                height={3}
                crawl={true}
                showSpinner={false}
                easing="ease"
                speed={200}
                shadow="0 0 10px hsl(var(--primary)),0 0 5px hsl(var(--primary)/0.5)"
              />
              <div className="relative flex min-h-screen flex-col bg-background">
                {children}
              </div>
              <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                closeOnClick
                pauseOnHover
              />
            </ThemeProvider>
          </QueryProvider>
        </ApiInterceptorProvider>
      </body>
    </html>
  );
}
