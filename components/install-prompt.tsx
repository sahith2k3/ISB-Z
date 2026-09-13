"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Download, Share, SquarePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInstallPrompt } from "@/hooks/use-install-prompt";

export function InstallPrompt() {
  const [mounted, setMounted] = useState(false);
  const [autoHidden, setAutoHidden] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { visible, canPromptNatively, showIosInstructions, promptInstall, dismiss } =
    useInstallPrompt();

  // Auto-dismiss after ~7.5 seconds
  useEffect(() => {
    if (!visible) return;
    const timer = window.setTimeout(() => {
      setAutoHidden(true);
    }, 7500);
    return () => window.clearTimeout(timer);
  }, [visible]);

  if (!mounted) {
    return null;
  }

  const isOpen = visible && !autoHidden;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{
            opacity: [0, 1, 0.25, 1, 0.25, 1, 0.25, 1],
            y: 0,
          }}
          exit={{ opacity: 0, y: 24, scale: 0.96 }}
          transition={{
            opacity: {
              duration: 2.1,
              times: [0, 0.14, 0.28, 0.42, 0.56, 0.70, 0.84, 1],
              ease: "easeInOut",
            },
            y: { type: "spring", damping: 24, stiffness: 260 },
            scale: { duration: 0.25 },
          }}
          className="fixed inset-x-0 bottom-[calc(5.25rem+env(safe-area-inset-bottom,0px))] z-40 flex justify-center px-4 pointer-events-none"
        >
          <div className="pointer-events-auto w-full max-w-md rounded-2xl border border-border/80 bg-card/95 shadow-2xl backdrop-blur-md p-3.5 sm:p-4 flex items-start gap-3">
            <img
              src="/icon-192.png"
              alt=""
              className="h-11 w-11 rounded-xl shrink-0 shadow-sm"
            />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-foreground">Install ISBusy</p>
              {canPromptNatively ? (
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  Add it to your home screen for one-tap access.
                </p>
              ) : showIosInstructions ? (
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 flex flex-wrap items-center gap-1">
                  Tap <Share className="h-3.5 w-3.5 inline shrink-0" /> then
                  <span className="inline-flex items-center gap-1 font-medium text-foreground">
                    &quot;Add to Home Screen&quot; <SquarePlus className="h-3.5 w-3.5" />
                  </span>
                </p>
              ) : null}

              {canPromptNatively && (
                <Button
                  size="sm"
                  className="mt-2.5 h-8 text-xs font-semibold rounded-xl"
                  onClick={promptInstall}
                >
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  Install
                </Button>
              )}
            </div>
            <button
              onClick={() => {
                setAutoHidden(true);
                dismiss();
              }}
              aria-label="Dismiss install prompt"
              className="text-muted-foreground hover:text-foreground transition-colors shrink-0 p-1 -m-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
