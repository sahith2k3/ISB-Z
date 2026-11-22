"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Avatar } from "@/components/ui/avatar";
import { useGetMyBirthdayWishes } from "@/lib/api-client";
import { Heart, Lock, Sparkles, Cake, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BirthdayWishesModalProps {
  studentId: number;
  isOpen: boolean;
  onClose: () => void;
}

export function BirthdayWishesModal({
  studentId,
  isOpen,
  onClose,
}: BirthdayWishesModalProps) {
  const { data, isLoading } = useGetMyBirthdayWishes(studentId, {
    query: {
      enabled: isOpen && !!studentId,
    },
  });

  const count = data?.count ?? 0;
  const wishes = data?.wishes ?? [];

  return (
    <Dialog open={isOpen} onOpenChange={(val) => (!val ? onClose() : null)}>
      <DialogContent className="max-w-md w-[92vw] rounded-3xl border border-pink-500/25 bg-background p-6 shadow-2xl backdrop-blur-md">
        <DialogHeader className="text-left space-y-1 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎁</span>
              <DialogTitle className="text-xl font-display font-bold">
                Birthday Wishes
              </DialogTitle>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
              <Lock className="h-3 w-3 text-muted-foreground" /> Private to you
            </span>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Friends from ISB who sent you birthday greetings on ISBusy today.
          </DialogDescription>
        </DialogHeader>

        {/* Wishes Count Banner */}
        <div className="rounded-2xl border border-pink-500/20 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-amber-500/10 p-4 flex items-center justify-between my-2">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-pink-500/20 text-pink-500 flex items-center justify-center font-bold text-xl">
              🎂
            </div>
            <div>
              <p className="text-2xl font-black font-display text-foreground leading-none">
                {isLoading ? "..." : count}
              </p>
              <p className="text-xs text-muted-foreground font-medium mt-1">
                {count === 1 ? "friend has wished you" : "friends have wished you"}
              </p>
            </div>
          </div>
          <Sparkles className="h-6 w-6 text-pink-500/60 animate-pulse" />
        </div>

        {/* Wishes List */}
        <div className="max-h-[300px] overflow-y-auto space-y-2.5 pr-1 my-2">
          {isLoading ? (
            <div className="space-y-2 py-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-muted/50 animate-pulse"
                >
                  <div className="h-10 w-10 rounded-full bg-muted" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 w-24 bg-muted rounded" />
                    <div className="h-2.5 w-16 bg-muted rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : wishes.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <PartyPopper className="h-10 w-10 mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-sm font-medium">No wishes recorded yet today</p>
              <p className="text-xs text-muted-foreground/80 mt-1 max-w-[240px] mx-auto">
                When friends click &quot;Wish Happy Birthday&quot; on your profile, their names will show here!
              </p>
            </div>
          ) : (
            wishes.map((w) => (
              <div
                key={w.id}
                className="flex items-center justify-between p-3 rounded-2xl border border-card-border bg-card/60 hover:bg-card transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar name={w.senderName} className="h-10 w-10 text-xs shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {w.senderName}
                    </p>
                    <p className="text-[11px] text-muted-foreground capitalize truncate">
                      {w.senderCampus} • Sec {w.senderSection}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-pink-500 text-xs shrink-0 pl-2">
                  <Heart className="h-3.5 w-3.5 fill-pink-500 text-pink-500" />
                </div>
              </div>
            ))
          )}
        </div>

        <div className="pt-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full rounded-2xl font-semibold"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
