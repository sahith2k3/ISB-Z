"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Download, Share, SquarePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInstallPrompt } from "@/hooks/use-install-prompt";

export function InstallPrompt() {
  const { visible, canPromptNatively, showIosInstructions, promptInstall, dismiss } =
    useInstallPrompt();

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ type: "spring", damping: 24, stiffness: 260 }}
          className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-4"
        >
          <div className="w-full max-w-md rounded-2xl border bg-card shadow-lg p-4 flex items-start gap-3">
            <img
              src="/icon-192.png"
              alt=""
              className="h-11 w-11 rounded-xl shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-foreground">Install ISBusy</p>
              {canPromptNatively ? (
                <p className="text-sm text-muted-foreground mt-0.5">
                  Add it to your home screen for one-tap access.
                </p>
              ) : showIosInstructions ? (
                <p className="text-sm text-muted-foreground mt-0.5 flex flex-wrap items-center gap-1">
                  Tap <Share className="h-3.5 w-3.5 inline shrink-0" /> then
                  <span className="inline-flex items-center gap-1 font-medium text-foreground">
                    &quot;Add to Home Screen&quot; <SquarePlus className="h-3.5 w-3.5" />
                  </span>
                </p>
              ) : null}

              {canPromptNatively && (
                <Button
                  size="sm"
                  className="mt-3 h-8"
                  onClick={promptInstall}
                >
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  Install
                </Button>
              )}
            </div>
            <button
              onClick={dismiss}
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
