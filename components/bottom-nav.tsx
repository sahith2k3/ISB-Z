"use client";

import { Home, Sparkles, Armchair, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useLocalStudent } from "@/hooks/use-local-student";
import { useGetStudent } from "@/lib/api-client";

const defaultItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/scheduler", label: "Scheduler", icon: Sparkles },
  { href: "/seating", label: "Seating", icon: Armchair },
  { href: "/sg-planner", label: "SG planner", icon: Users },
];

const hydItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/scheduler", label: "Scheduler", icon: Sparkles },
  { href: "/sg-planner", label: "SG planner", icon: Users },
];

export function BottomNav() {
  const pathname = usePathname();
  const { studentId } = useLocalStudent();
  const { data: me } = useGetStudent(studentId || 0);

  const isHyd = me?.campus === "hyderabad";
  const items = isHyd ? hydItems : defaultItems;
  const gridColsClass = isHyd ? "grid-cols-3" : "grid-cols-4";

  return (
    <nav
      aria-label="Primary navigation"
      className="fixed bottom-0 left-1/2 z-30 w-full max-w-md -translate-x-1/2 border-t border-border/60 bg-background/95 px-2 sm:px-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_24px_rgba(20,30,60,0.06)] backdrop-blur-md"
    >
      <div className={cn("grid gap-1 sm:gap-1.5", gridColsClass)}>
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
                "flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[11px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="truncate max-w-full">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
