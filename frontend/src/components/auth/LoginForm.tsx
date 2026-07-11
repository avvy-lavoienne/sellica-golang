"use client"

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import {
  ArrowRight,
  Loader2,
  Shield,
  Mail,
  Lock,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff,
} from "lucide-react";

import { supabase } from "@/lib/conn/supabaseClient";
import { cn } from "@/lib/conn/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Logo } from "@/components/landing/Logo";
import { ThemeToggle } from "@/components/landing/ThemeToggle";
import { FormField } from "./FormField";
import { PasswordStrengthIndicator } from "./PasswordStrengthIndicator";
import { LoginFormData, ValidationState, FormState } from "./types";
import { useGoAuth } from "@/hooks/useGoAuth";
import { useGoBackend, useAuthFallback } from "@/lib/config/features";

// Form validation rules
const validationRules = {
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: "Please enter a valid email address",
  },
  password: {
    required: true,
    minLength: 6,
    message: "Password must be at least 6 characters",
  },
};

// Animation variants
const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

export default function LoginForm() {
  const router = useRouter();

  // Feature flags for authentication system selection
  const shouldUseGoAuth = useGoBackend();
  const enableFallback = useAuthFallback();
  const goAuth = useGoAuth();

  // Form state
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
    rememberMe: false,
  });

  const [formState, setFormState] = useState<FormState>({
    fields: {
      email: {
        value: "",
        isValid: false,
        isDirty: false,
        isTouched: false,
        focused: false,
        errors: [],
        warnings: [],
      },
      password: {
        value: "",
        isValid: false,
        isDirty: false,
        isTouched: false,
        focused: false,
        errors: [],
        warnings: [],
      },
    },
    isSubmitting: false,
    isValid: false,
    submitCount: 0,
    errors: [],
  });

  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Handle mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // Validate field
  const validateField = useCallback(
    (name: keyof LoginFormData, value: string): ValidationState => {
      const errors: string[] = [];
      const warnings: string[] = [];

      if (name === "email") {
        if (!value && validationRules.email.required) {
          errors.push("Email is required");
        } else if (value && !validationRules.email.pattern.test(value)) {
          errors.push(validationRules.email.message);
        }
      }

      if (name === "password") {
        if (!value && validationRules.password.required) {
          errors.push("Password is required");
        } else if (value && value.length < validationRules.password.minLength) {
          errors.push(validationRules.password.message);
        }
      }

      return {
        isValid: errors.length === 0,
        isDirty: value !== "",
        isTouched: formState.fields[name]?.isTouched || false,
        errors,
        warnings,
      };
    },
    [formState.fields],
  );

  // Handle field change
  const handleFieldChange = useCallback(
    (name: keyof LoginFormData, value: string) => {
      setFormData((prev) => ({ ...prev, [name]: value }));

      const validation = validateField(name, value);

      setFormState((prev) => ({
        ...prev,
        fields: {
          ...prev.fields,
          [name]: {
            ...prev.fields[name],
            value,
            ...validation,
            isDirty: true,
          },
        },
      }));
    },
    [validateField],
  );

  // Handle field focus
  const handleFieldFocus = useCallback((name: keyof LoginFormData) => {
    setFormState((prev) => ({
      ...prev,
      fields: {
        ...prev.fields,
        [name]: {
          ...prev.fields[name],
          focused: true,
        },
      },
    }));
  }, []);

  // Handle field blur
  const handleFieldBlur = useCallback((name: keyof LoginFormData) => {
    setFormState((prev) => ({
      ...prev,
      fields: {
        ...prev.fields,
        [name]: {
          ...prev.fields[name],
          focused: false,
          isTouched: true,
        },
      },
    }));
  }, []);

  // Validate entire form
  const validateForm = useCallback(() => {
    const emailValidation = validateField("email", formData.email);
    const passwordValidation = validateField("password", formData.password);

    const isValid = emailValidation.isValid && passwordValidation.isValid;

    setFormState((prev) => ({
      ...prev,
      fields: {
        email: { ...prev.fields.email, ...emailValidation, isTouched: true },
        password: {
          ...prev.fields.password,
          ...passwordValidation,
          isTouched: true,
        },
      },
      isValid,
    }));

    return isValid;
  }, [formData, validateField]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setFormState((prev) => ({
      ...prev,
      isSubmitting: true,
      submitCount: prev.submitCount + 1,
      errors: [],
    }));

    try {
      let authResult;
      let authError = null;

      // Use Go backend authentication if enabled
      if (shouldUseGoAuth) {
        console.log('🚀 Using Go backend authentication');
        authResult = await goAuth.login(formData.email, formData.password);

        if (authResult.success && authResult.user) {
          console.log('✅ Go backend authentication successful');
          toast.success("Login successful! Redirecting to dashboard...");

          // Add a small delay for better UX
          setTimeout(() => {
            router.push("/dashboard");
          }, 1500);
          return;
        } else {
          authError = authResult.error;
          console.warn('⚠️ Go backend authentication failed:', authError);

          // Try fallback to Supabase if enabled
          if (enableFallback) {
            console.log('🔄 Attempting fallback to Supabase authentication');
          } else {
            throw new Error(authError || 'Go backend authentication failed');
          }
        }
      }

      // Use Supabase authentication (original or fallback)
      if (!shouldUseGoAuth || (enableFallback && authError)) {
        console.log(shouldUseGoAuth ? '🔄 Using Supabase fallback authentication' : '📱 Using Supabase authentication');
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) {
          let errorMessage = "An error occurred during login";

          if (error.message.includes("Invalid login credentials")) {
            errorMessage =
              "Invalid email or password. Please check your credentials and try again.";
          } else if (error.message.includes("Email not confirmed")) {
            errorMessage =
              "Please check your email and click the confirmation link before logging in.";
          } else if (error.message.includes("Too many requests")) {
            errorMessage =
              "Too many login attempts. Please wait a moment before trying again.";
          } else {
            errorMessage = error.message;
          }

          setFormState((prev) => ({
            ...prev,
            isSubmitting: false,
            errors: [errorMessage],
          }));
          return;
        }

        if (data.user) {
          console.log('✅ Supabase authentication successful');
          toast.success("Login successful! Redirecting to dashboard...");

          // Add a small delay for better UX
          setTimeout(() => {
            router.push("/dashboard");
          }, 1500);
        }
      }
    } catch (err: any) {
      console.error('❌ Authentication error:', err);

      let errorMessage = "Unable to connect to server. Please check your internet connection and try again.";

      // Handle Go backend specific errors
      if (shouldUseGoAuth && err.message) {
        if (err.message.includes("Invalid credentials")) {
          errorMessage = "Invalid email or password. Please check your credentials and try again.";
        } else if (err.message.includes("Network error")) {
          errorMessage = "Network error. Please check your connection and try again.";
        } else if (err.message.includes("timeout")) {
          errorMessage = "Request timeout. Please try again.";
        } else {
          errorMessage = err.message;
        }
      }

      setFormState((prev) => ({
        ...prev,
        isSubmitting: false,
        errors: [errorMessage],
      }));
    }
  };

  // Check if form is ready to submit
  const canSubmit =
    !formState.isSubmitting &&
    formData.email.trim() !== "" &&
    formData.password.trim() !== "";

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse">
          <div className="h-8 w-32 rounded bg-muted"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="flex items-center justify-between p-4 md:p-6">
        <Logo
          showBrandName={true}
          variant="default"
          size="md"
          priority={true}
        />
        <ThemeToggle variant="button" size="sm" showLabel={false} />
      </header>

      {/* Main Content */}
      <main className="flex flex-1 items-center justify-center px-4 py-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-md"
        >
          <Card className="border-border/50 bg-card/95 shadow-2xl backdrop-blur-sm">
            <CardHeader className="space-y-4 text-center">
              <motion.div variants={itemVariants}>
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-2xl font-bold tracking-tight">
                  Welcome Back
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Sign in to your SELLICA account to continue
                </CardDescription>
              </motion.div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Error Alert */}
              <AnimatePresence>
                {formState.errors.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{formState.errors[0]}</AlertDescription>
                    </Alert>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Authentication System Indicator */}
              {process.env.NODE_ENV === 'development' && (
                <div className="text-xs text-muted-foreground text-center p-2 bg-muted/50 rounded-md">
                  🔧 Auth System: {shouldUseGoAuth ? '🚀 Go Backend' : '📱 Next.js/Supabase'}
                  {shouldUseGoAuth && enableFallback && ' (with fallback)'}
                </div>
              )}

              {/* Login Form */}
              <motion.form
                variants={itemVariants}
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                {/* Email Field */}
                <FormField
                  name="email"
                  label="Email Address"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(value) => handleFieldChange("email", value)}
                  onFocus={() => handleFieldFocus("email")}
                  onBlur={() => handleFieldBlur("email")}
                  validation={formState.fields.email}
                  fieldState={formState.fields.email}
                  required
                  autoComplete="email"
                  leftIcon={<Mail className="h-4 w-4" />}
                  disabled={formState.isSubmitting}
                  size="lg"
                />

                {/* Password Field */}
                <FormField
                  name="password"
                  label="Password"
                  type="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(value) => handleFieldChange("password", value)}
                  onFocus={() => handleFieldFocus("password")}
                  onBlur={() => handleFieldBlur("password")}
                  validation={formState.fields.password}
                  fieldState={formState.fields.password}
                  showPasswordToggle={true}
                  required
                  autoComplete="current-password"
                  leftIcon={<Lock className="h-4 w-4" />}
                  disabled={formState.isSubmitting}
                  size="lg"
                />

                {/* Forgot Password Link */}
                <div className="flex justify-end">
                  <Link
                    href="/forgot-password"
                    className="text-sm text-primary transition-colors hover:text-primary/80"
                  >
                    Forgot your password?
                  </Link>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className={cn(
                    "h-12 w-full text-base font-medium transition-all duration-200",
                    !canSubmit && "cursor-not-allowed opacity-50",
                  )}
                  disabled={!canSubmit}
                  size="lg"
                >
                  {formState.isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>

                {/* Debug info (remove in production) */}
                {process.env.NODE_ENV === "development" && (
                  <div className="mt-2 rounded bg-muted p-2 text-xs text-muted-foreground">
                    <div>Can Submit: {canSubmit ? "Yes" : "No"}</div>
                    <div>Email: {formData.email.trim().length} chars</div>
                    <div>Password: {formData.password.trim().length} chars</div>
                    <div>
                      Is Submitting: {formState.isSubmitting ? "Yes" : "No"}
                    </div>
                  </div>
                )}
              </motion.form>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              {/* Register Link */}
              <motion.div variants={itemVariants} className="text-center">
                <p className="text-sm text-muted-foreground">
                  Don&apos;t have an account?{" "}
                  <Link
                    href="/register"
                    className="font-medium text-primary transition-colors hover:text-primary/80"
                  >
                    Create one here
                  </Link>
                </p>
              </motion.div>

              {/* Terms and Privacy */}
              <motion.div variants={itemVariants} className="text-center">
                <p className="text-xs text-muted-foreground">
                  By signing in, you agree to our{" "}
                  <Link
                    href="/terms"
                    className="underline transition-colors hover:text-foreground"
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/privacy"
                    className="underline transition-colors hover:text-foreground"
                  >
                    Privacy Policy
                  </Link>
                </p>
              </motion.div>
            </CardFooter>
          </Card>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center">
        <p className="text-xs text-muted-foreground">
          © 2024 SELLICA. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
