"use client"

import { useState } from "react"
import Link from "next/link"
import { ExternalLink, Shield, FileText, Eye } from "lucide-react"
import { cn } from "@/lib/conn/utils"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface TermsAcceptanceProps {
  acceptTerms: boolean
  acceptPrivacy: boolean
  onTermsChange: (accepted: boolean) => void
  onPrivacyChange: (accepted: boolean) => void
  className?: string
  required?: boolean
  showPreviews?: boolean
}

export function TermsAcceptance({
  acceptTerms,
  acceptPrivacy,
  onTermsChange,
  onPrivacyChange,
  className,
  required = true,
  showPreviews = true
}: TermsAcceptanceProps) {
  const [termsDialogOpen, setTermsDialogOpen] = useState(false)
  const [privacyDialogOpen, setPrivacyDialogOpen] = useState(false)

  return (
    <div className={cn("space-y-4", className)}>
      {/* Security Notice */}
      <div className="flex items-start gap-3 rounded-lg border border-border/50 bg-muted/50 p-4">
        <Shield className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-foreground">
            Data Security & Privacy
          </h4>
          <p className="text-xs text-muted-foreground">
            Your personal information is protected with enterprise-grade
            security. We comply with government data protection standards and
            never share your information without consent.
          </p>
        </div>
      </div>

      {/* Terms of Service Acceptance */}
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <Checkbox
            id="accept-terms"
            checked={acceptTerms}
            onCheckedChange={onTermsChange}
            required={required}
            className="mt-1"
            aria-describedby="terms-description"
          />
          <div className="flex-1 space-y-2">
            <label
              htmlFor="accept-terms"
              className="cursor-pointer text-sm font-medium text-foreground"
            >
              I agree to the Terms of Service
              {required && <span className="ml-1 text-destructive">*</span>}
            </label>
            <p id="terms-description" className="text-xs text-muted-foreground">
              By checking this box, you agree to our terms of service, including
              user responsibilities, service availability, and account policies.
            </p>
            <div className="flex items-center gap-2">
              <Link
                href="/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary transition-colors hover:text-primary/80"
              >
                <FileText className="h-3 w-3" />
                Read full Terms of Service
                <ExternalLink className="h-3 w-3" />
              </Link>

              {showPreviews && (
                <Dialog
                  open={termsDialogOpen}
                  onOpenChange={setTermsDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <Eye className="mr-1 h-3 w-3" />
                      Quick preview
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Terms of Service - Preview</DialogTitle>
                      <DialogDescription>
                        Key highlights from our terms of service
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 text-sm">
                      <div>
                        <h4 className="mb-2 font-medium">
                          Account Responsibilities
                        </h4>
                        <ul className="list-inside list-disc space-y-1 text-muted-foreground">
                          <li>Maintain accurate and up-to-date information</li>
                          <li>Keep your login credentials secure</li>
                          <li>
                            Use the service in compliance with applicable laws
                          </li>
                          <li>Report any security issues immediately</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="mb-2 font-medium">
                          Service Availability
                        </h4>
                        <ul className="list-inside list-disc space-y-1 text-muted-foreground">
                          <li>
                            Service provided on an &quot;as-is&quot; basis
                          </li>
                          <li>
                            Scheduled maintenance may cause temporary downtime
                          </li>
                          <li>
                            Emergency maintenance may occur without notice
                          </li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="mb-2 font-medium">Data Usage</h4>
                        <ul className="list-inside list-disc space-y-1 text-muted-foreground">
                          <li>
                            Data used only for civil registration purposes
                          </li>
                          <li>
                            Information shared with authorized government
                            agencies
                          </li>
                          <li>
                            Audit trails maintained for security and compliance
                          </li>
                        </ul>
                      </div>
                    </div>
                    <div className="flex justify-end pt-4">
                      <Link href="/terms" target="_blank">
                        <Button variant="outline" size="sm">
                          <FileText className="mr-2 h-4 w-4" />
                          Read Complete Terms
                        </Button>
                      </Link>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Privacy Policy Acceptance */}
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <Checkbox
            id="accept-privacy"
            checked={acceptPrivacy}
            onCheckedChange={onPrivacyChange}
            required={required}
            className="mt-1"
            aria-describedby="privacy-description"
          />
          <div className="flex-1 space-y-2">
            <label
              htmlFor="accept-privacy"
              className="cursor-pointer text-sm font-medium text-foreground"
            >
              I agree to the Privacy Policy
              {required && <span className="ml-1 text-destructive">*</span>}
            </label>
            <p
              id="privacy-description"
              className="text-xs text-muted-foreground"
            >
              By checking this box, you acknowledge that you have read and
              understand how we collect, use, and protect your personal
              information.
            </p>
            <div className="flex items-center gap-2">
              <Link
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary transition-colors hover:text-primary/80"
              >
                <Shield className="h-3 w-3" />
                Read full Privacy Policy
                <ExternalLink className="h-3 w-3" />
              </Link>

              {showPreviews && (
                <Dialog
                  open={privacyDialogOpen}
                  onOpenChange={setPrivacyDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <Eye className="mr-1 h-3 w-3" />
                      Quick preview
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Privacy Policy - Preview</DialogTitle>
                      <DialogDescription>
                        Key highlights from our privacy policy
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 text-sm">
                      <div>
                        <h4 className="mb-2 font-medium">
                          Information We Collect
                        </h4>
                        <ul className="list-inside list-disc space-y-1 text-muted-foreground">
                          <li>
                            Personal identification information (name, NIK, NIP)
                          </li>
                          <li>Contact information (email, phone)</li>
                          <li>
                            Professional information (position, department)
                          </li>
                          <li>
                            System usage data for security and improvement
                          </li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="mb-2 font-medium">
                          How We Use Your Information
                        </h4>
                        <ul className="list-inside list-disc space-y-1 text-muted-foreground">
                          <li>Provide civil registration services</li>
                          <li>Verify identity and authorize access</li>
                          <li>
                            Communicate important updates and notifications
                          </li>
                          <li>Improve system security and functionality</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="mb-2 font-medium">Data Protection</h4>
                        <ul className="list-inside list-disc space-y-1 text-muted-foreground">
                          <li>Enterprise-grade encryption for all data</li>
                          <li>Regular security audits and monitoring</li>
                          <li>
                            Access controls and authentication requirements
                          </li>
                          <li>
                            Compliance with government data protection standards
                          </li>
                        </ul>
                      </div>
                    </div>
                    <div className="flex justify-end pt-4">
                      <Link href="/privacy" target="_blank">
                        <Button variant="outline" size="sm">
                          <Shield className="mr-2 h-4 w-4" />
                          Read Complete Policy
                        </Button>
                      </Link>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Validation Status */}
      {required && (!acceptTerms || !acceptPrivacy) && (
        <div className="rounded-md border border-border/30 bg-muted/30 p-3 text-xs text-muted-foreground">
          <p className="flex items-center gap-2">
            <FileText className="h-3 w-3" />
            Please accept both the Terms of Service and Privacy Policy to
            continue with registration.
          </p>
        </div>
      )}
    </div>
  );
}
