import Image from "next/image";
import { motion } from "framer-motion";
import { User, Settings, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import VyuLogo from "@/assets/images/vyu-logo.svg";

export default function ProfileHeader() {
  return (
    <div className="space-y-4 text-center laptop:space-y-6">
      {/* Enhanced Logo Section */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="mb-6 flex justify-center"
      >
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-primary/10 blur-xl" />
          <div className="relative rounded-full bg-background p-4 shadow-lg ring-1 ring-border">
            <Image
              src={VyuLogo.src}
              width={80}
              height={80}
              alt="Sellica Logo"
              className="laptop:h-24 laptop:w-24"
            />
          </div>
        </div>
      </motion.div>

      {/* Enhanced Title Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="space-y-3"
      >
        <div className="flex items-center justify-center gap-2">
          <User className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground laptop:text-3xl">
            Profil Pengguna
          </h1>
        </div>

        <p className="mx-auto max-w-md text-sm text-muted-foreground laptop:text-base">
          Kelola informasi pribadi dan pengaturan akun Anda dengan aman
        </p>

        {/* Enhanced Status Badges */}
        <div className="flex items-center justify-center gap-2 pt-2">
          <Badge variant="secondary" className="gap-1">
            <Shield className="h-3 w-3" />
            Terverifikasi
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Settings className="h-3 w-3" />
            Dapat Diedit
          </Badge>
        </div>
      </motion.div>
    </div>
  );
}
