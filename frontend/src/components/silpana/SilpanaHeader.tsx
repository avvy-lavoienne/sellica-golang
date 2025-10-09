import { typo, textColors } from "@/lib/typography";
import { Badge } from "@/components/ui/badge";
import { Shield, Activity } from "lucide-react";

export default function SilpanaHeader() {
  return (
    <div className="mb-6 space-y-4">
      {/* Header with icon and title - Flowbite pattern */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          {/* Icon container with Flowbite colors */}
          <div className="rounded-lg bg-blue-50 p-2 ring-2 ring-blue-100 dark:bg-blue-900/20 dark:ring-blue-800/30">
            <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
            SILPANA
          </h1>
        </div>
        {/* Status badge with Flowbite styling */}
        <Badge variant="outline" className="gap-1.5 border-green-200 bg-green-50 px-2.5 py-1 text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400">
          <Activity className="h-3 w-3" aria-hidden="true" />
          <span className="text-xs">Aktif</span>
        </Badge>
      </div>
      {/* Description with Flowbite text colors */}
      <p className="max-w-4xl text-base leading-relaxed text-gray-600 dark:text-gray-400">
        <span className="font-semibold text-gray-900 dark:text-white">Sistem Informasi Layanan Pengaduan Administrasi dan Nominatif Aktivitas</span> — 
        Platform modern untuk mengajukan dan melacak status pengaduan administratif Anda secara real-time dengan transparansi penuh dan efisiensi tinggi.
      </p>
    </div>
  )
}