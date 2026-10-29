"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";

export function SeatingTickerBanner() {
  const router = useRouter();

  const tickerText =
    "📢 NOTICE: The Study Group Finder page will be removed this Wednesday! • Please finalize and save your study groups before Wednesday • Tap here to view Study Group Finder •";

  return (
    <Link
      href="/sg-planner"
      prefetch={true}
      onPointerDown={() => router.prefetch("/sg-planner")}
      data-testid="seating-ticker-banner"
      className="group relative mt-3 flex w-full cursor-pointer touch-manipulation select-none items-center overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/15 via-rose-500/10 to-primary/10 p-1.5 shadow-sm transition-all duration-150 hover:border-primary/50 hover:shadow-md active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [touch-action:pan-y]"
    >
      {/* TV Breaking News Tag */}
      <div className="z-10 flex shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-rose-600 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-sm pointer-events-none">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
        </span>
        <span>NOTICE</span>
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
