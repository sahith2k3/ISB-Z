"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { useLocalStudent } from "@/hooks/use-local-student";
import { useGetStudent } from "@/lib/api-client";

export function SeatingTickerBanner() {
  const router = useRouter();
  const { studentId } = useLocalStudent();
  const { data: me } = useGetStudent(studentId || 0);

  // Strictly hide the Mohali seating announcement for Hyderabad students
  if (me?.campus === "hyderabad") {
    return null;
  }

  const tickerText =
    "🚨 SEATINGS ARE NOW LIVE FOR MOHALI STUDENTS! 🪑 25 of 26 classroom layouts uploaded • Tap here to view your seat & layout • Updated for Term 5 •";

  return (
    <Link
      href="/seating"
      prefetch={true}
      onPointerDown={() => router.prefetch("/seating")}
      data-testid="seating-ticker-banner"
      className="group relative mt-3 flex w-full cursor-pointer touch-manipulation select-none items-center overflow-hidden rounded-2xl border border-rose-500/30 bg-gradient-to-r from-rose-500/15 via-amber-500/10 to-primary/10 p-1.5 shadow-sm transition-all duration-150 hover:border-primary/50 hover:shadow-md active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [touch-action:pan-y]"
    >
      {/* TV Breaking News Tag */}
      <div className="z-10 flex shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-sm pointer-events-none">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
        </span>
        <span className="hidden xs:inline">MOHALI</span>
        <span>LIVE</span>
      </div>

      {/* Sliding TV-style horizontal marquee - pointer-events-none ensures touch lands on Link */}
      <div className="pointer-events-none select-none relative flex-1 overflow-hidden py-1">
        <div className="animate-marquee flex w-max whitespace-nowrap text-xs font-bold text-foreground">
          <span className="mx-3">{tickerText}</span>
          <span className="mx-3">{tickerText}</span>
        </div>
      </div>

      {/* Trailing arrow */}
      <div className="z-10 flex shrink-0 items-center px-1 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-primary pointer-events-none">
        <ChevronRight className="h-4 w-4" />
      </div>
    </Link>
  );
}
