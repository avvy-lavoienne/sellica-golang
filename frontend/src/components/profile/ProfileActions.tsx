"use client"

import { motion } from "framer-motion";
import { Edit, Save, X, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ProfileActionsProps {
  isEditing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onDeleteAvatar: () => void;
  hasAvatar: boolean;
}

export default function ProfileActions({
  isEditing,
  onEdit,
  onSave,
  onCancel,
  onDeleteAvatar,
  hasAvatar,
}: ProfileActionsProps) {
  return (
    <TooltipProvider>
      <Card className="border-0 shadow-none">
        <CardContent className="px-0 pt-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex justify-center"
          >
            {isEditing ? (
              /* Enhanced Editing Actions */
              <div className="flex w-full flex-col gap-3 laptop:w-auto laptop:flex-row">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={onSave}
                      size="lg"
                      className="min-w-[140px] gap-2 transition-all duration-200 hover:scale-105"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Simpan Perubahan</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Simpan semua perubahan profil
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={onCancel}
                      variant="outline"
                      size="lg"
                      className="min-w-[120px] gap-2 transition-all duration-200 hover:scale-105"
                    >
                      <X className="h-4 w-4" />
                      <span>Batal</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Batalkan perubahan dan kembali ke mode tampilan
                  </TooltipContent>
                </Tooltip>
              </div>
            ) : (
              /* Enhanced View Mode Action */
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={onEdit}
                    size="lg"
                    className="min-w-[140px] gap-2 transition-all duration-200 hover:scale-105"
                  >
                    <Edit className="h-4 w-4" />
                    <span>Edit Profil</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Mulai mengedit informasi profil Anda
                </TooltipContent>
              </Tooltip>
            )}
          </motion.div>

          {/* Enhanced Status Indicator */}
          {isEditing && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 text-center"
            >
              <p className="text-xs text-muted-foreground">
                Mode edit aktif • Pastikan semua informasi sudah benar sebelum
                menyimpan
              </p>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
