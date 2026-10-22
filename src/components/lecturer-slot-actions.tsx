"use client";

import { useState, useTransition } from "react";
import { unassignSlot, deleteSlot } from "@/actions/slot-actions";
import { Button } from "@/components/ui/button";
import { UserMinus, Trash2, Loader2, AlertCircle } from "lucide-react";

interface LecturerSlotActionsProps {
  slotId: string;
  isBooked: boolean;
}

export function LecturerSlotActions({ slotId, isBooked }: LecturerSlotActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleUnassign = () => {
    setErrorMessage(null);
    if (!confirm("Apakah Anda yakin ingin membatalkan booking mahasiswa pada slot ini? Slot akan kembali tersedia untuk mahasiswa lain.")) {
      return;
    }

    startTransition(async () => {
      const result = await unassignSlot(slotId);
      if (!result.success) {
        setErrorMessage(result.error || "Gagal membatalkan booking.");
      }
    });
  };

  const handleDelete = () => {
    setErrorMessage(null);
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    startTransition(async () => {
      const result = await deleteSlot(slotId);
      if (!result.success) {
        setErrorMessage(result.error || "Gagal menghapus slot.");
        setConfirmDelete(false);
      }
    });
  };

  return (
    <div className="flex flex-col items-end gap-1.5">
      {errorMessage && (
        <span className="text-xs text-red-600 flex items-center gap-1">
          <AlertCircle className="h-3 w-3 shrink-0" />
          <span>{errorMessage}</span>
        </span>
      )}

      <div className="flex items-center gap-2">
        {isBooked && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleUnassign}
            disabled={isPending}
            className="text-amber-700 border-amber-300 hover:bg-amber-50 hover:text-amber-800 text-xs flex items-center gap-1.5"
            title="Kembalikan status slot ke Tersedia"
          >
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <UserMinus className="h-3.5 w-3.5" />
            )}
            <span>Batalkan Booking (Unassign)</span>
          </Button>
        )}

        {confirmDelete ? (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-red-600 font-medium">Yakin hapus?</span>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={isPending}
              className="text-xs px-2.5 h-8 bg-red-600 hover:bg-red-700"
            >
              {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Ya, Hapus"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmDelete(false)}
              disabled={isPending}
              className="text-xs px-2 h-8 text-slate-500"
            >
              Batal
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={isPending}
            className="text-slate-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 text-xs flex items-center gap-1.5"
            title="Hapus slot jadwal ini"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Hapus Slot</span>
          </Button>
        )}
      </div>
    </div>
  );
}
