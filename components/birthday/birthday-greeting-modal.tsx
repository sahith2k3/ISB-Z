"use client";

import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { fireCelebratoryConfetti } from "@/lib/confetti";
import { Sparkles, PartyPopper, Heart } from "lucide-react";
import { getTodayKolkataMMDD } from "@/lib/birthday";

interface BirthdayGreetingModalProps {
  studentId: number;
  studentName: string;
  isOpen?: boolean;
  onClose?: () => void;
  forceOpen?: boolean;
}

export function BirthdayGreetingModal({
  studentId,
  studentName,
  isOpen: controlledIsOpen,
  onClose: controlledOnClose,
  forceOpen = false,
}: BirthdayGreetingModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);

  const isControlled = controlledIsOpen !== undefined;
  const open = isControlled ? controlledIsOpen : internalOpen;

  useEffect(() => {
    if (forceOpen) {
      setInternalOpen(true);
      fireCelebratoryConfetti();
      return;
    }

    if (!studentId) return;

    // Check if greeted today (Asia/Kolkata date key)
    try {
      const today = getTodayKolkataMMDD();
      const currentYear = new Date().getFullYear();
      const storageKey = `isbusy_birthday_greeted_${studentId}_${currentYear}_${today}`;
      const alreadyGreeted = window.localStorage.getItem(storageKey);

      if (!alreadyGreeted) {
        // First visit on their birthday!
        setInternalOpen(true);
        window.localStorage.setItem(storageKey, "true");
        // Trigger celebratory confetti burst after brief delay for smooth appearance
        setTimeout(() => {
          fireCelebratoryConfetti();
        }, 300);
      }
    } catch (e) {
      console.error("Failed to read/write birthday greeting state:", e);
    }
  }, [studentId, forceOpen]);

  const handleClose = () => {
    if (isControlled && controlledOnClose) {
      controlledOnClose();
    } else {
      setInternalOpen(false);
    }
  };

  const firstName = studentName.split(" ")[0];

  return (
    <Dialog open={open} onOpenChange={(val) => (!val ? handleClose() : null)}>
      <DialogContent className="max-w-md w-[92vw] rounded-3xl border-2 border-pink-500/30 bg-gradient-to-b from-card via-card to-pink-500/5 p-6 sm:p-8 text-center shadow-2xl backdrop-blur-md overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute -top-24 -left-24 h-48 w-48 rounded-full bg-pink-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center">
          {/* Animated Birthday Icon with bouncy cake */}
          <div className="relative mb-4 flex items-center justify-center">
            <div className="h-20 w-20 rounded-3xl bg-gradient-to-tr from-pink-500/20 via-purple-500/20 to-amber-500/20 border border-pink-500/30 flex items-center justify-center shadow-inner">
              <span className="text-4xl select-none animate-bounce">🎂</span>
            </div>
            <div className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-amber-400 to-pink-500 text-white shadow-md">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>

          <DialogTitle className="text-2xl sm:text-3xl font-display font-black tracking-tight mb-2">
            <span className="birthday-name-rainbow">
              Happy Birthday, {firstName}! 🥳
            </span>
          </DialogTitle>

          <DialogDescription className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-6 max-w-sm">
            Wishing you an incredible birthday and a remarkable year ahead at ISB!
            May your calendar be light, your study group meetings joyful, and your year filled with triumphs and laughter! 🎈✨
          </DialogDescription>

          {/* Highlights badge */}
          <div className="w-full rounded-2xl border border-pink-500/20 bg-pink-500/10 p-3.5 mb-6 text-xs text-foreground flex items-center justify-center gap-2">
            <PartyPopper className="h-4 w-4 text-pink-500 shrink-0" />
            <span>
              Your profile has birthday mode enabled today with celebratory colors!
            </span>
          </div>

          {/* Action Button */}
          <div className="flex flex-col sm:flex-row gap-2 w-full">
            <Button
              onClick={() => {
                fireCelebratoryConfetti();
                handleClose();
              }}
              className="w-full rounded-2xl bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 text-white font-bold py-6 text-base shadow-lg shadow-pink-500/25 hover:from-pink-600 hover:to-indigo-700 active:scale-95 transition-all"
            >
              Thank you! Let&apos;s celebrate 🥳
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
