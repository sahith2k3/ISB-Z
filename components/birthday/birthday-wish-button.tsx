"use client";

import React, { useState } from "react";
import { useGetBirthdayWishStatus, useSendBirthdayWish } from "@/lib/api-client";
import { fireCelebratoryConfetti } from "@/lib/confetti";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, MessageCircle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BirthdayWishButtonProps {
  recipientId: number;
  recipientName: string;
  senderId?: number | null;
  className?: string;
  variant?: "default" | "card" | "banner";
}

export function BirthdayWishButton({
  recipientId,
  recipientName,
  senderId,
  className,
  variant = "default",
}: BirthdayWishButtonProps) {
  const { toast } = useToast();
  const [justWished, setJustWished] = useState(false);

  const { data: statusData, isLoading } = useGetBirthdayWishStatus(
    recipientId,
    senderId || undefined
  );
  const sendWishMutation = useSendBirthdayWish();

  const hasWished = statusData?.hasWished || justWished;
  const isSelf = senderId === recipientId;

  if (isSelf) return null;

  const handleSendWish = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!senderId) {
      toast({ description: "Please select your student profile first!" });
      return;
    }

    if (hasWished) {
      toast({ description: `You already wished ${recipientName} today! 💖` });
      return;
    }

    try {
      fireCelebratoryConfetti();
      setJustWished(true);

      await sendWishMutation.mutateAsync({
        recipientId,
        senderId,
        message: "Happy Birthday!",
      });

      toast({
        title: "🎂 Wish Sent!",
        description: `Your birthday wish was sent to ${recipientName}!`,
      });
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        description: "Could not record wish right now, but you can still wish on WhatsApp!",
      });
    }
  };

  const firstName = recipientName.split(" ")[0];
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
    `Happy Birthday ${firstName}! 🎂🎉 Wishing you an incredible year ahead! — via ISBusy`
  )}`;

  if (variant === "card") {
    return (
      <div
        className={cn(
          "rounded-2xl border border-pink-500/25 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-amber-500/10 p-4 shadow-sm",
          className
        )}
      >
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl animate-bounce">🎂</span>
          <div>
            <h4 className="text-sm font-bold text-foreground">
              Today is {recipientName}&apos;s Birthday!
            </h4>
            <p className="text-xs text-muted-foreground">
              Make their day extra special with a warm birthday wish!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            onClick={handleSendWish}
            disabled={sendWishMutation.isPending || hasWished}
            className={cn(
              "rounded-full font-semibold transition-all duration-200 active:scale-95",
              hasWished
                ? "bg-emerald-600/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/20"
                : "bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md hover:from-pink-600 hover:to-purple-700 hover:shadow-lg"
            )}
          >
            {hasWished ? (
              <>
                <Check className="h-4 w-4 mr-1.5" /> Wished! 💖
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-1.5" /> Wish Happy Birthday 🎂
              </>
            )}
          </Button>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 text-xs font-semibold rounded-full border border-border/80 bg-background/80 px-3 py-1.5 text-muted-foreground transition-all hover:bg-card hover:text-foreground active:scale-95"
          >
            <MessageCircle className="h-3.5 w-3.5 text-emerald-500" /> WhatsApp
          </a>
        </div>
      </div>
    );
  }

  return (
    <Button
      size="sm"
      onClick={handleSendWish}
      disabled={sendWishMutation.isPending || hasWished}
      className={cn(
        "rounded-full font-semibold text-xs transition-all duration-200 active:scale-95",
        hasWished
          ? "bg-emerald-600/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
          : "bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow hover:from-pink-600 hover:to-purple-700",
        className
      )}
    >
      {hasWished ? (
        <>
          <Check className="h-3.5 w-3.5 mr-1" /> Wished 💖
        </>
      ) : (
        <>
          <Sparkles className="h-3.5 w-3.5 mr-1" /> Wish 🎂
        </>
      )}
    </Button>
  );
}
