"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  PlusCircle,
  RefreshCw,
  Activity,
  TrendingUp,
  BarChart3,
  Clock,
  Users,
} from "lucide-react";

interface DashboardHeaderProps {
  onRefresh?: () => void;
  onAddNew?: () => void;
  showActions?: boolean;
}

export function DashboardHeader({
  onRefresh,
  onAddNew,
  showActions = false,
}: DashboardHeaderProps) {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: -20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <Card className="border-0 shadow-lg laptop:shadow-xl">
      <CardContent className="p-6 laptop:p-8">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="flex flex-col gap-6 laptop:flex-row laptop:items-center laptop:justify-between"
        >
          {/* Enhanced Header Content */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
                <Activity className="h-6 w-6 text-primary" />
              </div>
              <div>
                <motion.h1
                  variants={item}
                  className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-2xl font-bold tracking-tight text-transparent laptop:text-3xl"
                >
                  Dashboard Aktivitas User
                </motion.h1>
                <div className="mt-1 flex items-center gap-2">
                  <Badge variant="secondary" className="gap-1">
                    <Clock className="h-3 w-3" />
                    Real-time
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <Users className="h-3 w-3" />
                    Multi-user
                  </Badge>
                </div>
              </div>
            </div>

            <motion.p
              variants={item}
              className="max-w-2xl text-muted-foreground"
            >
              Pantau dan analisis semua aktivitas pengguna dalam sistem secara
              real-time, termasuk aktivitas SIAK, pengaduan bulanan, dan
              dokumentasi dengan visualisasi data yang komprehensif.
            </motion.p>

            {/* Enhanced Stats Preview */}
            <motion.div
              variants={item}
              className="flex items-center gap-4 pt-2"
            >
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4 text-success" />
                <span>Aktivitas meningkat</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <BarChart3 className="h-4 w-4 text-primary" />
                <span>Data terkini</span>
              </div>
            </motion.div>
          </div>

          {/* Enhanced Actions */}
          {showActions && (
            <motion.div
              variants={item}
              className="flex flex-col gap-3 laptop:flex-row"
            >
              {onRefresh && (
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="outline"
                    size="default"
                    onClick={onRefresh}
                    className="min-w-[120px] gap-2 transition-all duration-200"
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span>Refresh Data</span>
                  </Button>
                </motion.div>
              )}

              {onAddNew && (
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    size="default"
                    onClick={onAddNew}
                    className="min-w-[120px] gap-2 transition-all duration-200"
                  >
                    <PlusCircle className="h-4 w-4" />
                    <span>Tambah Baru</span>
                  </Button>
                </motion.div>
              )}
            </motion.div>
          )}
        </motion.div>
      </CardContent>
    </Card>
  );
}
