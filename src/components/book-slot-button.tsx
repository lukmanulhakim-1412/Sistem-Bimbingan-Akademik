"use client";

import { useState, useTransition } from "react";
import { bookSlot } from "@/actions/slot-actions";
import { Button } from "@/components/ui/button";
import { Loader2, CalendarCheck2, AlertCircle } from "lucide-react";

interface BookSlotButtonProps {
  slotId: string;
}

export function BookSlotButton({ slotId }: BookSlotButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isBookedSuccess, setIsBookedSuccess] = useState(false);

  const handleBooking = () => {
    setErrorMessage(null);

    startTransition(async () => {
      const res = await bookSlot(slotId);

      if (!res.success) {
        setErrorMessage(
          res.error || "Gagal membooking slot. Silakan refresh dan coba lagi."
        );
      } else {
        setIsBookedSuccess(true);
      }
    });
  };

  return (
    <div className="w-full space-y-1.5">
      {errorMessage && (
        <div className="text-xs text-red-600 bg-red-50 border border-red-200 p-2 rounded-md flex items-start gap-1.5">
          <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-red-500" />
          <span>{errorMessage}</span>
        </div>
      )}

      <Button
        onClick={handleBooking}
        disabled={isPending || isBookedSuccess}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center justify-center gap-2 h-10 shadow-sm"
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Memproses Booking...</span>
          </>
        ) : isBookedSuccess ? (
          <>
            <CalendarCheck2 className="h-4 w-4 text-emerald-300" />
            <span>Berhasil Dibooking!</span>
          </>
        ) : (
          <>
            <CalendarCheck2 className="h-4 w-4" />
            <span>Booking Jadwal</span>
          </>
        )}
      </Button>
    </div>
  );
}
