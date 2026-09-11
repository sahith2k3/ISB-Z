import { useEffect, useState, useCallback } from 'react';

const DISMISSED_KEY = 'isbusy_install_dismissed';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari's non-standard flag for "launched from home screen"
    (window.navigator as { standalone?: boolean }).standalone === true
  );
}

function isIos() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

/**
 * Surfaces a "you can install this app" prompt.
 * - On Chromium browsers, captures the native beforeinstallprompt event so we
 *   can trigger the real install flow from our own banner UI.
 * - On iOS Safari, there is no such event; we instead show manual
 *   "Share > Add to Home Screen" instructions.
 * - Never shows if already installed/standalone, or if the user dismissed it.
 */
export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISSED_KEY) === '1');
  const [standalone] = useState(isStandalone);
  const ios = isIos();

  useEffect(() => {
    if (standalone) return;

    const handler = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [standalone]);

  const dismiss = useCallback(() => {
    localStorage.setItem(DISMISSED_KEY, '1');
    setDismissed(true);
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    if (outcome === 'accepted' || outcome === 'dismissed') {
      dismiss();
    }
  }, [deferredPrompt, dismiss]);

  const canPromptNatively = deferredPrompt !== null;
  const showIosInstructions = ios && !standalone && !dismissed && !canPromptNatively;
  const visible = !standalone && !dismissed && (canPromptNatively || showIosInstructions);

  return { visible, canPromptNatively, showIosInstructions, promptInstall, dismiss };
}
