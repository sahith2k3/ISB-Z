"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function SeatingTickerBanner() {
  const tickerText =
    "🚨 SEATINGS ARE NOW LIVE FOR MOHALI STUDENTS! 🪑 25 of 26 classroom layouts uploaded • Tap here to view your seat & layout • Updated for Term 5 •";

  return (
    <Link
      href="/seating"
      data-testid="seating-ticker-banner"
      className="group relative mt-3 flex items-center overflow-hidden rounded-2xl border border-rose-500/30 bg-gradient-to-r from-rose-500/15 via-amber-500/10 to-primary/10 p-1.5 shadow-sm transition-all duration-200 hover:border-primary/50 hover:shadow-md"
    >
      {/* TV Breaking News Tag */}
      <div className="z-10 flex shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-sm">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
        </span>
        <span className="hidden xs:inline">MOHALI</span>
        <span>LIVE</span>
      </div>

      {/* Sliding TV-style horizontal marquee */}
      <div className="relative flex-1 overflow-hidden py-1">
        <div className="animate-marquee flex w-max whitespace-nowrap text-xs font-bold text-foreground">
          <span className="mx-3">{tickerText}</span>
          <span className="mx-3">{tickerText}</span>
        </div>
      </div>

      {/* Trailing arrow */}
      <div className="z-10 flex shrink-0 items-center px-1 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-primary">
        <ChevronRight className="h-4 w-4" />
      </div>
    </Link>
  );
}
