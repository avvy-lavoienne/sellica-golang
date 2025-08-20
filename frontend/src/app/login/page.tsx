import LoginForm from "@/components/auth/LoginForm"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Sign In | SELLICA - Civil Registration System",
  description:
    "Sign in to your SELLICA account to access the civil registration system dashboard and manage your government services efficiently.",
  keywords: [
    "login",
    "sign in",
    "SELLICA",
    "civil registration",
    "government",
    "authentication",
  ],
  authors: [{ name: "SELLICA Team" }],
  robots: {
    index: false, // Don't index login pages
    follow: false,
  },
  openGraph: {
    title: "Sign In | SELLICA",
    description: "Access your SELLICA civil registration system account",
    type: "website",
    locale: "id_ID",
  },
  twitter: {
    card: "summary",
    title: "Sign In | SELLICA",
    description: "Access your SELLICA civil registration system account",
  },
};

export default function LoginPage() {
  return (
    <>
      {/* Skip to main content for accessibility */}
      <a
        href="#main-content"
        className="sr-only z-50 rounded-md bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:absolute focus:left-4 focus:top-4"
      >
        Skip to main content
      </a>

      {/* Main login form */}
      <div id="main-content">
        <LoginForm />
      </div>
    </>
  );
}
