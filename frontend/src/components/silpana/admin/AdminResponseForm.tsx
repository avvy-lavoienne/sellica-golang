"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "react-toastify";
import { Send, Loader2, Paperclip, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AdminResponseFormProps {
  ticketId: string;
  ticketCode: string;
  onResponseSent?: () => void;
}

export default function AdminResponseForm({
  ticketId,
  ticketCode,
  onResponseSent
}: AdminResponseFormProps) {
  const [message, setMessage] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) {
      toast.error("Pesan tidak boleh kosong");
      return;
    }

    setIsSubmitting(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const response = await fetch(
        `${apiUrl}/api/v1/silpana/tickets/${ticketId}/communications`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // Add authentication header if needed
            // "Authorization": `Bearer ${getAuthToken()}`
          },
          body: JSON.stringify({
            message: message.trim(),
            sender_type: "admin",
            sender_name: "Admin SILPANA", // TODO: Get from auth context
            is_internal: isInternal,
            attachments: [],
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Gagal mengirim respon");
      }

      const data = await response.json();

      toast.success(
        isInternal
          ? "Catatan internal berhasil ditambahkan"
          : "Respon berhasil dikirim ke pengadu"
      );

      // Reset form
      setMessage("");
      setIsInternal(false);

      // Callback to refresh ticket data
      if (onResponseSent) {
        onResponseSent();
      }
    } catch (error: any) {
      console.error("Error sending response:", error);
      toast.error(error.message || "Gagal mengirim respon");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Kirim Respon ke Pengadu</CardTitle>
        <CardDescription>
          Respon Anda akan langsung terlihat oleh pengadu saat mereka memeriksa tiket{" "}
          <span className="font-mono font-semibold">{ticketCode}</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="message">Pesan</Label>
            <Textarea
              id="message"
              placeholder="Tulis respon untuk pengadu..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              disabled={isSubmitting}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {message.length} karakter
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is-internal"
              checked={isInternal}
              onCheckedChange={setIsInternal}
              disabled={isSubmitting}
            />
            <Label htmlFor="is-internal" className="cursor-pointer">
              Catatan Internal (hanya visible untuk admin)
            </Label>
          </div>

          {isInternal && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Catatan ini hanya akan terlihat oleh admin, tidak akan dikirim ke pengadu
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-between pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => {
                // TODO: Implement file attachment
                toast.info("Fitur lampiran file akan segera hadir");
              }}
            >
              <Paperclip className="mr-2 h-4 w-4" />
              Lampirkan File
            </Button>

            <Button
              type="submit"
              disabled={!message.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Mengirim...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  {isInternal ? "Simpan Catatan" : "Kirim Respon"}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
