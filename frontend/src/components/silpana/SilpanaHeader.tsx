import { typo, textColors } from "@/lib/typography";
import { Badge } from "@/components/ui/badge";
import { Shield, Activity } from "lucide-react";

export default function SilpanaHeader() {
  return (
    <div className="mb-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-blue-500/10 p-2 ring-2 ring-blue-500/20">
            <Shield className="h-6 w-6 text-blue-500" aria-hidden="true" />
          </div>
          <h1 className={typo.heading(1, `${textColors.primary} tracking-tight`)}>
            SILPANA
          </h1>
        </div>
        <Badge variant="outline" className="gap-1.5 px-2.5 py-1">
          <Activity className="h-3 w-3" aria-hidden="true" />
          <span className="text-xs">Aktif</span>
        </Badge>
      </div>
      <p className={typo.body('base', `${textColors.secondary} max-w-4xl leading-relaxed`)}>
        <span className="font-semibold text-foreground">Sistem Informasi Layanan Pengaduan Administrasi dan Nominatif Aktivitas</span> — 
        Platform modern untuk mengajukan dan melacak status pengaduan administratif Anda secara real-time dengan transparansi penuh dan efisiensi tinggi.
      </p>
    </div>
  )
}