import RegisterForm from "@/components/auth/register-form"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Create Account | SELLICA - Civil Registration System",
  description:
    "Create your SELLICA account to access government civil registration services. Secure registration process with enterprise-grade data protection.",
  keywords: [
    "register",
    "sign up",
    "create account",
    "SELLICA",
    "civil registration",
    "government",
    "registration",
  ],
  authors: [{ name: "SELLICA Team" }],
  robots: {
    index: false, // Don't index registration pages
    follow: false,
  },
  openGraph: {
    title: "Create Account | SELLICA",
    description:
      "Join SELLICA to access government civil registration services",
    type: "website",
    locale: "id_ID",
  },
  twitter: {
    card: "summary",
    title: "Create Account | SELLICA",
    description:
      "Join SELLICA to access government civil registration services",
  },
};

export default function RegisterPage() {
  return (
    <>
      {/* Skip to main content for accessibility */}
      <a
        href="#main-content"
        className="sr-only z-50 rounded-md bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:absolute focus:left-4 focus:top-4"
      >
        Skip to main content
      </a>

      {/* Main registration form */}
      <div id="main-content">
        <RegisterForm />
      </div>
    </>
  );
}
