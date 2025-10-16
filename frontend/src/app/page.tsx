"use client"

import { Suspense } from "react";
import Link from "next/link";
import {
  BarChart3,
  FileText,
  Database,
  Shield,
  Users,
  Clock,
  Zap,
  Award,
  TrendingUp,
  ChevronUp,
  X,
  Linkedin,
  Github,
  Star,
  CheckCircle,
  ArrowRight,
  Play,
  Globe,
  Lock,
  Smartphone,
  Headphones,
  Building,
  MapPin,
  Mail,
  Phone,
} from "lucide-react";

// Enhanced landing page components
import { Navigation } from "@/components/landing/Navigation";
import { HeroSection } from "@/components/landing/HeroSection";
import { Section } from "@/components/landing/Section";
// Temporarily hidden components
// import { FeatureCard } from "@/components/landing/FeatureCard";
// import { BenefitItem } from "@/components/landing/BenefitItem";
// import { Testimonial } from "@/components/landing/Testimonial";
import { PerformanceMonitor } from "@/components/landing/PerformanceMonitor";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import SilpanaGuestAccess from "@/components/silpana/SilpanaGuestAccess";

// Enhanced data with better messaging and value propositions
const featuresData = [
  {
    icon: BarChart3,
    title: "Dashboard Analytics Terintegrasi",
    description:
      "Visualisasi data real-time dengan dashboard yang komprehensif. Monitor KPI, tren, dan insights mendalam untuk pengambilan keputusan yang lebih baik dan efektif.",
    href: "#dashboard",
    badge: "Real-time",
    metrics: "99.9% Uptime",
  },
  {
    icon: FileText,
    title: "Sistem Pengaduan Digital",
    description:
      "Platform pengaduan elektronik yang transparan dan efisien. Lacak status, kelola eskalasi, dan tingkatkan kepuasan masyarakat dengan response time yang cepat.",
    href: "#complaints",
    badge: "24/7 Available",
    metrics: "< 2 Hours Response",
  },
  {
    icon: Database,
    title: "Manajemen Data Aman",
    description:
      "Sistem penyimpanan data catatan sipil dengan enkripsi enterprise-grade. Backup otomatis, disaster recovery, dan compliance dengan standar keamanan internasional.",
    href: "#data-management",
    badge: "ISO 27001",
    metrics: "AES-256 Encryption",
  },
  {
    icon: Shield,
    title: "Keamanan Multi-Layer",
    description:
      "Perlindungan berlapis dengan enkripsi end-to-end, autentikasi multi-faktor, dan audit trail komprehensif. Keamanan tingkat bank untuk data pemerintah.",
    href: "#security",
    badge: "Bank-Grade",
    metrics: "Zero Breach Record",
  },
  {
    icon: Zap,
    title: "Performa Ultra-Cepat",
    description:
      "Sistem yang dioptimalkan untuk kecepatan maksimal. Response time di bawah 200ms, load balancing otomatis, dan CDN global untuk akses yang konsisten.",
    href: "#performance",
    badge: "< 200ms",
    metrics: "Global CDN",
  },
  {
    icon: Award,
    title: "Sertifikasi Internasional",
    description:
      "Memenuhi standar ISO 27001, SOC 2 Type II, dan sertifikasi keamanan internasional. Compliance penuh dengan regulasi pemerintah dan best practices global.",
    href: "#standards",
    badge: "Certified",
    metrics: "SOC 2 Type II",
  },
];

const benefitsData = [
  {
    icon: Shield,
    title: "Keamanan Tingkat Enterprise",
    description:
      "Data dilindungi dengan enkripsi AES-256, sistem backup redundan, monitoring keamanan 24/7, dan compliance dengan standar internasional untuk menjaga kerahasiaan informasi pemerintah.",
    metrics: "99.99% Secure",
    features: [
      "AES-256 Encryption",
      "24/7 Monitoring",
      "Disaster Recovery",
      "Compliance Ready",
    ],
  },
  {
    icon: Users,
    title: "Akses Multi-Platform Universal",
    description:
      "Akses seamless dari desktop, tablet, dan mobile dengan sinkronisasi real-time. Interface yang intuitif dan responsive design untuk produktivitas maksimal di mana saja.",
    metrics: "Cross-Platform",
    features: [
      "Responsive Design",
      "Real-time Sync",
      "Offline Capability",
      "PWA Support",
    ],
  },
  {
    icon: Clock,
    title: "Efisiensi Waktu Maksimal",
    description:
      "Otomatisasi proses yang menghemat waktu hingga 80% dibandingkan sistem manual. Workflow yang dapat dikustomisasi, approval digital, dan integrasi sistem existing.",
    metrics: "80% Time Saved",
    features: [
      "Process Automation",
      "Digital Approval",
      "Custom Workflows",
      "System Integration",
    ],
  },
  {
    icon: TrendingUp,
    title: "Business Intelligence & Analytics",
    description:
      "Dashboard analitik real-time dengan AI-powered insights, predictive analytics, laporan otomatis, dan visualisasi data yang membantu pengambilan keputusan strategis.",
    metrics: "AI-Powered Insights",
    features: [
      "Real-time Analytics",
      "Predictive Insights",
      "Custom Reports",
      "Data Visualization",
    ],
  },
];

const testimonialsData = [
  {
    quote:
      "SELLICA telah mentransformasi cara kami mengelola data catatan sipil. Sistem yang intuitif, fitur keamanan yang robust, dan support team yang luar biasa membuat pekerjaan kami jauh lebih efisien dan aman.",
    author: "Budi Santoso",
    role: "Kepala Bagian Catatan Sipil",
    company: "Pemda Jakarta Pusat",
    rating: 5,
    avatar: "/images/testimonial-1.jpg",
    verified: true,
  },
  {
    quote:
      "Implementasi SELLICA sangat mudah dan tim support sangat responsif. Dalam 3 bulan, produktivitas tim kami meningkat 75% dengan error rate yang menurun drastis. ROI yang sangat menguntungkan.",
    author: "Siti Nurhaliza",
    role: "Manager IT",
    company: "Disdukcapil Bandung",
    rating: 5,
    avatar: "/images/testimonial-2.jpg",
    verified: true,
  },
  {
    quote:
      "Fitur analytics dan reporting di SELLICA memberikan insights yang sangat valuable untuk pengambilan keputusan. Dashboard yang comprehensive dan user-friendly memudahkan monitoring KPI secara real-time.",
    author: "Ahmad Rahman",
    role: "Direktur Teknologi Informasi",
    company: "Pemkot Surabaya",
    rating: 5,
    avatar: "/images/testimonial-3.jpg",
    verified: true,
  },
];

const statsData = [
  {
    value: "10,000+",
    label: "Active Users",
    description: "Government employees using SELLICA daily",
  },
  {
    value: "99.99%",
    label: "Uptime",
    description: "Reliable service availability",
  },
  {
    value: "< 200ms",
    label: "Response Time",
    description: "Ultra-fast system performance",
  },
  {
    value: "24/7",
    label: "Support",
    description: "Round-the-clock technical assistance",
  },
  {
    value: "50+",
    label: "Government Agencies",
    description: "Trusted by local governments",
  },
  {
    value: "ISO 27001",
    label: "Certified",
    description: "International security standards",
  },
];

const pricingPlans = [
  {
    name: "Starter",
    description: "Perfect for small government offices",
    price: "Contact Us",
    features: [
      "Up to 100 users",
      "Basic dashboard",
      "Standard security",
      "Email support",
      "Basic reporting",
    ],
    popular: false,
  },
  {
    name: "Professional",
    description: "Ideal for medium-sized agencies",
    price: "Contact Us",
    features: [
      "Up to 1,000 users",
      "Advanced analytics",
      "Enhanced security",
      "Priority support",
      "Custom reports",
      "API access",
    ],
    popular: true,
  },
  {
    name: "Enterprise",
    description: "For large government institutions",
    price: "Contact Us",
    features: [
      "Unlimited users",
      "Full customization",
      "Enterprise security",
      "24/7 dedicated support",
      "Advanced integrations",
      "On-premise deployment",
    ],
    popular: false,
  },
];

export default function Home() {
  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Skip to main content link for screen readers */}
      <a
        href="#main-content"
        className="skip-link sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:shadow-lg"
      >
        Skip to main content
      </a>

      {/* Performance Monitoring */}
      <Suspense fallback={null}>
        <PerformanceMonitor
          enableLogging={process.env.NODE_ENV === "development"}
        />
      </Suspense>

      {/* Navigation */}
      <Navigation
        navigationItems={[
          {
            label: "Tentang",
            href: "https://www.vyuapp.me",
            description: "Informasi tentang SELLICA",
            external: true,
          },
        ]}
        brand={{ name: "SELLICA", href: "/" }}
        actions={{
          secondary: { label: "Masuk", href: "/login", variant: "ghost" },
          primary: {
            label: "Tanya SELLY!",
            href: "/selly-ai",
            variant: "default",
          },
        }}
        showThemeToggle={true}
        sticky={true}
        blurBackground={true}
        maxWidth="xl"
      />

      {/* Main Content */}
      <main id="main-content">
        {/* Hero Section */}
        <HeroSection
          title="SELLICA"
          subtitle="Sistem Evaluasi Laporan Lengkap dan Catatan Aktivitas"
          description="Transformasi digital untuk pelayanan kinerja dan catatan sipil yang lebih efisien, aman, dan transparan."
          primaryAction={{
            label: "Daftar",
            href: "/register",
          }}
          secondaryAction={{
            label: "Tanya SELLY!",
            href: "/selly-ai",
          }}
          heroImage={{
            src: "/images/hero-dashboard.jpg",
            alt: "SELLICA Dashboard Interface",
          }}
        />

        {/* SILPANA Public Service Section */}
        <Section
          id="silpana"
          variant="muted"
          containerSize="xl"
          padding="xl"
        >
          <div className="mb-16 space-y-4 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
              <Users className="h-4 w-4" />
              Layanan Publik
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Sistem Layanan Pengaduan
              <span className="block text-primary">SILPANA</span>
            </h2>
            <p className="mx-auto max-w-3xl text-lg text-muted-foreground">
              Platform digital untuk menyampaikan keluhan, saran, dan masukan kepada pemerintah 
              dengan mudah, aman, dan responsif.
            </p>
          </div>

          <SilpanaGuestAccess />
        </Section>

        {/* Stats Section - Temporarily Hidden */}
        {/*
        <Section id="stats" variant="muted" containerSize="xl" padding="lg">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-6">
            {statsData.map((stat, index) => (
              <div
                key={index}
                className="animate-fade-in-up space-y-2 text-center"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="text-2xl font-bold text-primary md:text-3xl">
                  {stat.value}
                </div>
                <div className="text-sm font-medium text-foreground">
                  {stat.label}
                </div>
                <div className="text-xs text-muted-foreground">
                  {stat.description}
                </div>
              </div>
            ))}
          </div>
        </Section>
        */}

        {/* Features Section - Temporarily Hidden */}
        {/*
        <Section
          id="features"
          variant="default"
          containerSize="xl"
          padding="xl"
        >
          <div className="mb-16 space-y-4 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
              <Star className="h-4 w-4" />
              Fitur Unggulan
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Solusi Lengkap untuk
              <span className="block text-primary">Catatan Sipil Digital</span>
            </h2>
            <p className="mx-auto max-w-3xl text-lg text-muted-foreground">
              Fitur-fitur canggih yang dirancang khusus untuk memenuhi kebutuhan
              instansi pemerintah dalam mengelola data catatan sipil dengan
              efisien dan aman.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {featuresData.map((feature, index) => (
              <FeatureCard
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                href={feature.href}
                badge={feature.badge}
                metrics={feature.metrics}
                className="animate-fade-in-up"
              />
            ))}
          </div>
        </Section>
        */}

        {/* Benefits Section - Temporarily Hidden */}
        {/*
        <Section id="benefits" variant="muted" containerSize="xl" padding="xl">
          <div className="mb-16 space-y-4 text-center">
            <div className="border-success/20 bg-success/10 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium text-success">
              <CheckCircle className="h-4 w-4" />
              Keunggulan Kompetitif
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Mengapa Memilih
              <span className="block text-primary">SELLICA?</span>
            </h2>
            <p className="mx-auto max-w-3xl text-lg text-muted-foreground">
              Keunggulan yang membuat SELLICA menjadi pilihan utama instansi
              pemerintah untuk transformasi digital catatan sipil.
            </p>
          </div>

          <div className="grid gap-12 lg:grid-cols-2">
            {benefitsData.map((benefit, index) => (
              <BenefitItem
                key={index}
                icon={benefit.icon}
                title={benefit.title}
                description={benefit.description}
                metrics={benefit.metrics}
                features={benefit.features}
                className="animate-fade-in-up"
              />
            ))}
          </div>
        </Section>
        */}

        {/* Testimonials Section - Hidden */}
        {/*
        <Section
          id="testimonials"
          variant="default"
          containerSize="xl"
          padding="xl"
        >
          <div className="mb-16 space-y-4 text-center">
            <div className="bg-warning/10 border-warning/20 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium text-warning">
              <Users className="h-4 w-4" />
              Testimoni Pengguna
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Dipercaya oleh
              <span className="block text-primary">Instansi Pemerintah</span>
            </h2>
            <p className="mx-auto max-w-3xl text-lg text-muted-foreground">
              Dengar langsung dari para profesional pemerintah yang telah
              merasakan manfaat transformasi digital dengan SELLICA.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {testimonialsData.map((testimonial, index) => (
              <Testimonial
                key={index}
                quote={testimonial.quote}
                author={testimonial.author}
                role={testimonial.role}
                company={testimonial.company}
                rating={testimonial.rating}
                avatar={testimonial.avatar}
                verified={testimonial.verified}
                className="animate-fade-in-up"
              />
            ))}
          </div>
        </Section>
        */}

        {/* Pricing Section - Hidden */}
        {/*
        <Section id="pricing" variant="muted" containerSize="xl" padding="xl">
          <div className="mb-16 space-y-4 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
              <Building className="h-4 w-4" />
              Paket Berlangganan
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Pilih Paket yang
              <span className="block text-primary">Sesuai Kebutuhan</span>
            </h2>
            <p className="mx-auto max-w-3xl text-lg text-muted-foreground">
              Solusi fleksibel untuk berbagai ukuran instansi pemerintah.
              Konsultasi gratis untuk menentukan paket yang tepat.
            </p>
          </div>

          <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
            {pricingPlans.map((plan, index) => (
              <Card
                key={index}
                className={`relative ${plan.popular ? "scale-105 border-primary shadow-lg" : "border-border"} animate-fade-in-up`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <div className="rounded-full bg-primary px-4 py-1 text-sm font-medium text-primary-foreground">
                      Most Popular
                    </div>
                  </div>
                )}
                <CardHeader className="pb-8 text-center">
                  <CardTitle className="text-xl font-bold">
                    {plan.name}
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {plan.description}
                  </CardDescription>
                  <div className="mt-4">
                    <div className="text-3xl font-bold text-foreground">
                      {plan.price}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Custom pricing
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li
                        key={featureIndex}
                        className="flex items-center gap-3"
                      >
                        <CheckCircle className="h-4 w-4 flex-shrink-0 text-success" />
                        <span className="text-sm text-foreground">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="pt-4">
                    <Button
                      className="w-full"
                      variant={plan.popular ? "default" : "outline"}
                      size="lg"
                    >
                      Hubungi Sales
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="mb-4 text-muted-foreground">
              Butuh solusi khusus? Tim kami siap membantu merancang paket sesuai
              kebutuhan Anda.
            </p>
            <Button variant="outline" size="lg">
              <Phone className="mr-2 h-4 w-4" />
              Konsultasi Gratis
            </Button>
          </div>
        </Section>
        */}

        {/* CTA Section - Temporarily Hidden */}
        {/*
        <Section
          id="cta"
          variant="primary"
          containerSize="xl"
          padding="xl"
          className="text-center text-primary-foreground"
        >
          <div className="mx-auto max-w-4xl space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                Siap Transformasi Digital?
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-primary-foreground/80">
                Bergabunglah dengan 50+ instansi pemerintah yang telah merasakan
                manfaat SELLICA. Mulai transformasi digital Anda hari ini.
              </p>
            </div>

            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/register">
                <Button
                  size="lg"
                  variant="secondary"
                  className="h-12 px-8 text-base font-semibold"
                >
                  Daftar Gratis Sekarang
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/selly-ai">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 border-primary-foreground/20 px-8 text-base font-semibold text-primary-foreground hover:bg-primary-foreground/10"
                >
                  <Play className="mr-2 h-4 w-4" />
                  Tanya SELLY!
                </Button>
              </Link>
            </div>

            <div className="flex flex-wrap justify-center gap-8 border-t border-primary-foreground/20 pt-8">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                <span className="text-sm">Setup dalam 24 jam</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                <span className="text-sm">Training gratis</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                <span className="text-sm">Support 24/7</span>
              </div>
            </div>
          </div>
        </Section>
        */}

        {/* Footer */}
        <footer className="bg-slate-900 text-slate-300">
          <div className="container mx-auto px-4 py-16">
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {/* Company Info */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                    <span className="text-sm font-bold text-primary-foreground">
                      S
                    </span>
                  </div>
                  <span className="text-xl font-bold text-white">SELLICA</span>
                </div>
                <p className="text-sm leading-relaxed text-slate-400">
                  Solusi digital terdepan untuk sistem catatan sipil pemerintah.
                  Transformasi digital yang aman, efisien, dan terpercaya.
                </p>
                <div className="flex gap-4">
                  <Link
                    href="#"
                    className="text-slate-400 transition-colors hover:text-white"
                    aria-label="Twitter"
                  >
                    <X className="h-5 w-5" />
                  </Link>
                  <Link
                    href="#"
                    className="text-slate-400 transition-colors hover:text-white"
                    aria-label="LinkedIn"
                  >
                    <Linkedin className="h-5 w-5" />
                  </Link>
                  <Link
                    href="#"
                    className="text-slate-400 transition-colors hover:text-white"
                    aria-label="GitHub"
                  >
                    <Github className="h-5 w-5" />
                  </Link>
                </div>
              </div>

              {/* Product */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
                  Produk
                </h3>
                <ul className="space-y-3">
                  <li>
                    <Link
                      href="#features"
                      className="text-sm transition-colors hover:text-white"
                    >
                      Fitur Utama
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="#pricing"
                      className="text-sm transition-colors hover:text-white"
                    >
                      Harga
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="#security"
                      className="text-sm transition-colors hover:text-white"
                    >
                      Keamanan
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="#integrations"
                      className="text-sm transition-colors hover:text-white"
                    >
                      Integrasi
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Support */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
                  Dukungan
                </h3>
                <ul className="space-y-3">
                  <li>
                    <Link
                      href="#help"
                      className="text-sm transition-colors hover:text-white"
                    >
                      Pusat Bantuan
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="#docs"
                      className="text-sm transition-colors hover:text-white"
                    >
                      Dokumentasi
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="#contact"
                      className="text-sm transition-colors hover:text-white"
                    >
                      Hubungi Kami
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="#status"
                      className="text-sm transition-colors hover:text-white"
                    >
                      Status Sistem
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Contact */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
                  Kontak
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <span className="text-sm">info@sellica.id</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-slate-400" />
                    <span className="text-sm">+62 21 1234 5678</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-4 w-4 text-slate-400" />
                    <span className="text-sm">
                      Jakarta, Indonesia
                      <br />
                      Gedung Cyber 1, Lantai 10
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-800 pt-8 md:flex-row">
              <p className="text-sm text-slate-400">
                © 2024 SELLICA. All rights reserved.
              </p>
              <div className="flex gap-6">
                <Link
                  href="/privacy"
                  className="text-sm text-slate-400 transition-colors hover:text-white"
                >
                  Privacy Policy
                </Link>
                <Link
                  href="/terms"
                  className="text-sm text-slate-400 transition-colors hover:text-white"
                >
                  Terms of Service
                </Link>
                <Link
                  href="/cookies"
                  className="text-sm text-slate-400 transition-colors hover:text-white"
                >
                  Cookie Policy
                </Link>
              </div>
            </div>
          </div>
        </footer>

        {/* Scroll to Top Button */}
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-50 h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          aria-label="Scroll to top"
        >
          <ChevronUp className="mx-auto h-5 w-5" />
        </button>
      </main>
    </div>
  );
}
