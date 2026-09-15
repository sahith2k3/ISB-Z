"use client";

import { useState } from "react";
import { Share2, Users, Sparkles } from "lucide-react";
import { ShareModal } from "@/components/share-modal";
import { cn } from "@/lib/utils";

interface ShareButtonProps {
  source?: string;
  variant?: "icon" | "pill" | "banner";
  className?: string;
}

export function ShareButton({
  source = "header",
  variant = "icon",
  className,
}: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (variant === "banner") {
    return (
      <>
        <div
          className={cn(
            "relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-4 shadow-sm backdrop-blur-sm",
            className
          )}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary shadow-inner mt-0.5">
                <Users className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                    Invite Friends
                  </span>
                </div>
                <h3 className="font-display font-bold text-sm text-foreground leading-tight">
                  Share ISBusy with your study group
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                  Find out who's free between lectures & compare classes.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="shrink-0 inline-flex items-center gap-1.5 rounded-2xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 active:scale-95 transition-all"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span>Share</span>
            </button>
          </div>
        </div>

        <ShareModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          source={source}
        />
      </>
    );
  }

  if (variant === "pill") {
    return (
      <>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          title="Share ISBusy"
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 active:scale-95 transition-all shadow-sm",
            className
          )}
        >
          <Share2 className="h-3.5 w-3.5" />
          <span>Share</span>
        </button>

        <ShareModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          source={source}
        />
      </>
    );
  }

  // Default: icon button (for headers)
  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Share ISBusy with friends"
        title="Share ISBusy"
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-full border border-card-border bg-card text-muted-foreground transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          className
        )}
      >
        <Share2 className="h-4 w-4" />
      </button>

      <ShareModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        source={source}
      />
    </>
  );
}
