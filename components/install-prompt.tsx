"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Download, Share, SquarePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInstallPrompt } from "@/hooks/use-install-prompt";

import { usePathname } from "next/navigation";
import { useLocalStudent } from "@/hooks/use-local-student";

export function InstallPrompt() {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const { studentId } = useLocalStudent();

  useEffect(() => {
    setMounted(true);
  }, []);

  const { visible, canPromptNatively, showIosInstructions, promptInstall, dismiss } =
    useInstallPrompt();

  // On the first page (/ with no student selected), hide the prompt so it
  // never collides with the campus selection or "View Seating without sign up" bar
  const isOnboarding = pathname === "/" && !studentId;

  if (!mounted || isOnboarding) {
    return null;
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.98 }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
            boxShadow: [
              "0 10px 30px -10px rgba(0,0,0,0.2), 0 0 0 1px rgba(var(--primary-rgb, 59, 130, 246), 0.15)",
              "0 16px 36px -8px rgba(var(--primary-rgb, 59, 130, 246), 0.25), 0 0 0 1.5px rgba(var(--primary-rgb, 59, 130, 246), 0.4)",
              "0 10px 30px -10px rgba(0,0,0,0.2), 0 0 0 1px rgba(var(--primary-rgb, 59, 130, 246), 0.15)",
            ],
          }}
          exit={{ opacity: 0, y: 20, scale: 0.96 }}
          transition={{
            y: { type: "spring", damping: 26, stiffness: 220 },
            opacity: { duration: 0.4 },
            scale: { duration: 0.3 },
            boxShadow: {
              duration: 4.0,
              repeat: Infinity,
              ease: "easeInOut",
            },
          }}
          className="fixed inset-x-0 bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] z-40 flex justify-center px-4 pointer-events-none"
        >
          <div className="pointer-events-auto w-full max-w-md rounded-2xl border border-primary/25 bg-card/95 shadow-xl backdrop-blur-xl p-3.5 sm:p-4 flex items-center gap-3.5 transition-all">
            <div className="relative shrink-0">
              <img
                src="/icon-192.png"
                alt="ISBusy App"
                className="h-11 w-11 rounded-xl shadow-sm object-cover ring-1 ring-border/50"
              />
              <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary ring-2 ring-card">
                <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground animate-ping" />
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="font-display font-bold text-sm text-foreground leading-tight">
                  Install ISBusy
                </p>
                <span className="text-[10px] font-semibold text-primary/90 bg-primary/10 px-1.5 py-0.2 rounded-md">
                  Web App
                </span>
              </div>

              {canPromptNatively ? (
                <p className="text-xs text-muted-foreground mt-0.5 truncate sm:whitespace-normal">
                  Add to home screen for 1-tap offline access.
                </p>
              ) : showIosInstructions ? (
                <p className="text-xs text-muted-foreground mt-0.5 flex flex-wrap items-center gap-1 leading-relaxed">
                  Tap <Share className="h-3 w-3 inline shrink-0 text-primary" /> then
                  <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                    &quot;Add to Home Screen&quot; <SquarePlus className="h-3 w-3 text-primary" />
                  </span>
                </p>
              ) : (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Instant schedules and class seating on your device.
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {canPromptNatively && (
                <Button
                  size="sm"
                  className="h-8 px-3 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                  onClick={promptInstall}
                >
                  <Download className="h-3.5 w-3.5 mr-1" />
                  Install
                </Button>
              )}

              <button
                type="button"
                onClick={dismiss}
                aria-label="Close install banner"
                title="Dismiss"
                className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
