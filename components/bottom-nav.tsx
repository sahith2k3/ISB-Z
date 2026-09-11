"use client";

import { CalendarDays, Sparkles, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const items = [
  { href: "/schedule", label: "My schedule", icon: CalendarDays },
  { href: "/", label: "Friends", icon: Users },
  { href: "/scheduler", label: "Scheduler", icon: Sparkles },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary navigation"
      className="fixed bottom-0 left-1/2 z-30 w-full max-w-md -translate-x-1/2 border-t border-border/60 bg-background/95 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_24px_rgba(20,30,60,0.06)] backdrop-blur-md"
    >
      <div className="grid grid-cols-3 gap-1">
        {items.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/"
              ? pathname === "/"
              : pathname === href || pathname.startsWith(`${href}/`);

          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl px-2 text-[11px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}