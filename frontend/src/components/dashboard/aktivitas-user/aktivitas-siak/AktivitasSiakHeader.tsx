import { FileText } from "lucide-react"

export default function AktivitasSiakHeader() {
  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-2">
        <div className="rounded-md bg-primary/10 p-2">
          <FileText className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Data Aktivitas SIAK</h1>
          <p className="text-sm text-muted-foreground">Kelola dan lihat data aktivitas SIAK</p>
        </div>
      </div>
    </div>
  )
}
