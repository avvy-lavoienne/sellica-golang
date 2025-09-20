import { typo, textColors } from "@/lib/typography";

export default function SilpanaHeader() {
  return (
    <div className="mb-8 space-y-3">
      <h1 className={typo.heading(1, `${textColors.primary}`)}>
        SILPANA
      </h1>
      <p className={typo.body('base', `${textColors.secondary} max-w-4xl`)}>
        Sistem Informasi Pengaduan Administrasi dan Nominatif Aktivitas - Jelajahi dan lihat data pengaduan administratif serta aktivitas nominatif dalam sistem terintegrasi yang modern dan efisien.
      </p>
    </div>
  )
}