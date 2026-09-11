"use client";

import { useEffect, useState, useCallback } from "react";

const DISMISSED_KEY = "isbusy_install_dismissed";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari's non-standard flag for "launched from home screen"
    (window.navigator as { standalone?: boolean })?.standalone === true
  );
}

function isIos() {
  if (typeof window === "undefined" || !window.navigator) return false;
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(true);
  const [standalone, setStandalone] = useState(true);
  const [ios, setIos] = useState(false);

  // Initialize browser-only state after hydration
  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(DISMISSED_KEY) === "1");
    } catch {
      setDismissed(false);
    }
    setStandalone(isStandalone());
    setIos(isIos());
  }, []);

  useEffect(() => {
    if (standalone || typeof window === "undefined") return;

    const handler = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, [standalone]);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      // ignore in environments without localStorage
    }
    setDismissed(true);
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    if (outcome === "accepted" || outcome === "dismissed") {
      dismiss();
    }
  }, [deferredPrompt, dismiss]);

  const canPromptNatively = deferredPrompt !== null;
  const showIosInstructions = ios && !standalone && !dismissed && !canPromptNatively;
  const visible = !standalone && !dismissed && (canPromptNatively || showIosInstructions);

  return { visible, canPromptNatively, showIosInstructions, promptInstall, dismiss };
}
