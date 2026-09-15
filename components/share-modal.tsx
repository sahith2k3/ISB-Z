"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Copy, Share2, MessageCircle, Send, Sparkles } from "lucide-react";
import { useLocalStudent } from "@/hooks/use-local-student";
import { useGetStudent } from "@/lib/api-client";
import { track } from "@vercel/analytics";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  source?: string;
}

export function ShareModal({ isOpen, onClose, source = "unknown" }: ShareModalProps) {
  const { studentId, campus } = useLocalStudent();
  const { data: me } = useGetStudent(studentId || 0);
  const [copied, setCopied] = useState(false);
  const [totalShares, setTotalShares] = useState<number | null>(null);

  const appUrl = typeof window !== "undefined" ? window.location.origin : "https://isb-z.vercel.app";
  const shareText = "Check out ISBusy – live class schedules, who's free right now, and all classroom seating charts for ISB!";

  // Fetch share count for social proof
  useEffect(() => {
    if (isOpen) {
      fetch("/api/share")
        .then((res) => res.json())
        .then((data) => {
          if (typeof data.totalShares === "number") {
            setTotalShares(data.totalShares);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  const logShare = async (method: string) => {
    try {
      // 1. Log to PostgreSQL database
      fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: me?.id || studentId || null,
          studentName: me?.name || null,
          campus: me?.campus || campus || null,
          source,
          method,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.totalShares) setTotalShares(data.totalShares);
        })
        .catch(() => {});

      // 2. Track with Vercel Analytics
      track("app_shared", {
        studentId: String(me?.id || studentId || "anonymous"),
        studentName: me?.name || "Unknown",
        campus: me?.campus || campus || "unknown",
        method,
        source,
      });
    } catch {
      // ignore telemetry errors
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(appUrl);
      setCopied(true);
      logShare("clipboard");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
    }
  };

  const handleWhatsAppShare = () => {
    logShare("whatsapp");
    const message = `${shareText}\n${appUrl}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  const handleTelegramShare = () => {
    logShare("telegram");
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(appUrl)}&text=${encodeURIComponent(shareText)}`;
    window.open(telegramUrl, "_blank", "noopener,noreferrer");
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        logShare("native_share");
        await navigator.share({
          title: "ISBusy – ISB Schedule & Seating",
          text: shareText,
          url: appUrl,
        });
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          console.warn("Native share failed:", err);
        }
      }
    }
  };

  const canNativeShare = typeof navigator !== "undefined" && Boolean(navigator.share);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[92vw] max-w-sm rounded-3xl p-6 bg-card border-border shadow-2xl">
        <DialogHeader className="text-center sm:text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20 shadow-sm">
            <Share2 className="h-6 w-6" />
          </div>
          <DialogTitle className="font-display text-xl font-bold text-foreground">
            Share ISBusy
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            Help your friends and batchmates track schedules, view seating layouts, and see who is free right now.
          </DialogDescription>
        </DialogHeader>

        {totalShares !== null && totalShares > 0 && (
          <div className="flex items-center justify-center gap-1.5 py-1 px-3 rounded-full bg-primary/5 border border-primary/15 text-[11px] font-semibold text-primary mx-auto">
            <Sparkles className="h-3 w-3" />
            <span>Shared {totalShares}+ times by ISB students</span>
          </div>
        )}

        <div className="space-y-3 pt-2">
          {/* WhatsApp Direct Share Button */}
          <button
            type="button"
            onClick={handleWhatsAppShare}
            className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-[#25D366] px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#20bd5a] active:scale-[0.98] transition-all"
          >
            <MessageCircle className="h-4 w-4 fill-white" />
            Share via WhatsApp
          </button>

          {/* Native System Share Sheet (if supported) */}
          {canNativeShare && (
            <button
              type="button"
              onClick={handleNativeShare}
              className="flex w-full items-center justify-center gap-2.5 rounded-2xl border border-border bg-secondary/80 px-4 py-3 text-sm font-semibold text-foreground hover:bg-secondary active:scale-[0.98] transition-all"
            >
              <Share2 className="h-4 w-4 text-primary" />
              More Share Options
            </button>
          )}

          {/* Telegram Share Button */}
          <button
            type="button"
            onClick={handleTelegramShare}
            className="flex w-full items-center justify-center gap-2.5 rounded-2xl border border-sky-500/20 bg-sky-500/10 px-4 py-2.5 text-xs font-semibold text-sky-600 hover:bg-sky-500/20 active:scale-[0.98] transition-all"
          >
            <Send className="h-3.5 w-3.5 text-sky-500" />
            Share via Telegram
          </button>

          {/* Copy Link Input Box */}
          <div className="pt-1">
            <p className="text-[11px] font-medium text-muted-foreground mb-1.5 px-0.5">
              Or copy link:
            </p>
            <div className="flex items-center gap-2 rounded-2xl border border-input bg-secondary/40 p-1.5 pl-3">
              <span className="flex-1 truncate text-xs text-muted-foreground font-mono select-all">
                {appUrl}
              </span>
              <Button
                type="button"
                size="sm"
                onClick={handleCopyLink}
                className="h-8 px-3 rounded-xl text-xs font-semibold shrink-0 gap-1.5"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-300" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
