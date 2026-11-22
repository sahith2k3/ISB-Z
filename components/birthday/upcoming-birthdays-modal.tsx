"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useGetUpcomingBirthdays } from "@/lib/api-client";
import { isStudentBirthdayToday, formatDobForDisplay } from "@/lib/birthday";
import { BirthdayName } from "@/components/birthday/birthday-name";
import { BirthdayWishButton } from "@/components/birthday/birthday-wish-button";
import type { Campus } from "@/lib/types";
import { Calendar, MapPin, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface UpcomingBirthdaysModalProps {
  isOpen: boolean;
  onClose: () => void;
  userCampus?: Campus;
  currentUserId?: number;
}

export function UpcomingBirthdaysModal({
  isOpen,
  onClose,
  userCampus = "hyderabad",
  currentUserId,
}: UpcomingBirthdaysModalProps) {
  const [selectedCampus, setSelectedCampus] = useState<Campus>(userCampus);

  const { data, isLoading } = useGetUpcomingBirthdays(selectedCampus, 10, {
    query: {
      enabled: isOpen,
    },
  });

  const students = data?.students ?? [];

  return (
    <Dialog open={isOpen} onOpenChange={(val) => (!val ? onClose() : null)}>
      <DialogContent className="max-w-md w-[92vw] rounded-3xl border border-pink-500/25 bg-background p-6 shadow-2xl backdrop-blur-md">
        <DialogHeader className="text-left space-y-1 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl animate-bounce select-none">🎂</span>
              <DialogTitle className="text-xl font-display font-bold">
                Upcoming Birthdays
              </DialogTitle>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-pink-600 dark:text-pink-400 bg-pink-500/10 px-2.5 py-1 rounded-full">
              <Sparkles className="h-3 w-3" /> Next 10
            </span>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Upcoming cohort birthdays so you never miss a chance to celebrate!
          </DialogDescription>
        </DialogHeader>

        {/* Campus Switcher Tabs */}
        <div className="flex rounded-2xl bg-muted/60 p-1 my-1 border border-border/50">
          <button
            type="button"
            onClick={() => setSelectedCampus("hyderabad")}
            className={cn(
              "flex-1 py-1.5 text-xs font-bold rounded-xl transition-all duration-200",
              selectedCampus === "hyderabad"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Hyderabad {userCampus === "hyderabad" && "• You"}
          </button>
          <button
            type="button"
            onClick={() => setSelectedCampus("mohali")}
            className={cn(
              "flex-1 py-1.5 text-xs font-bold rounded-xl transition-all duration-200",
              selectedCampus === "mohali"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Mohali {userCampus === "mohali" && "• You"}
          </button>
        </div>

        {/* Upcoming Birthdays List */}
        <div className="max-h-[350px] overflow-y-auto space-y-2.5 pr-1 my-2">
          {isLoading ? (
            <div className="space-y-2 py-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-muted/40 animate-pulse"
                >
                  <div className="h-10 w-10 rounded-full bg-muted" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 w-28 bg-muted rounded" />
                    <div className="h-2.5 w-16 bg-muted rounded" />
                  </div>
                  <div className="h-5 w-16 bg-muted rounded-full" />
                </div>
              ))}
            </div>
          ) : students.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <Calendar className="h-10 w-10 mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-sm font-medium">No upcoming birthdays found</p>
            </div>
          ) : (
            students.map((s) => {
              const isToday = s.daysUntil === 0 || isStudentBirthdayToday(s);
              return (
                <div
                  key={s.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-2xl border transition-all",
                    isToday
                      ? "border-pink-500/40 bg-gradient-to-r from-pink-500/10 via-card to-card shadow-sm"
                      : "border-card-border bg-card/60 hover:bg-card"
                  )}
                >
                  <Link
                    href={`/student/${s.id}`}
                    onClick={onClose}
                    className="flex items-center gap-3 min-w-0 flex-1"
                  >
                    <Avatar
                      name={s.name}
                      isBirthday={isToday}
                      className="h-10 w-10 text-xs shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground truncate">
                        <BirthdayName name={s.name} isBirthday={isToday} />
                      </p>
                      <p className="text-[11px] text-muted-foreground capitalize truncate flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> Sec {s.section}
                      </p>
                    </div>
                  </Link>

                  <div className="flex items-center gap-2 shrink-0 pl-2">
                    {isToday ? (
                      <div className="flex items-center gap-1.5">
                        <Badge className="bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-[10px] px-2 py-0.5 border-none shadow-sm">
                          Today! 🎂
                        </Badge>
                        {currentUserId && currentUserId !== s.id && (
                          <BirthdayWishButton
                            recipientId={s.id}
                            recipientName={s.name}
                            senderId={currentUserId}
                          />
                        )}
                      </div>
                    ) : (
                      <div className="text-right">
                        <p className="text-xs font-bold text-foreground">
                          {formatDobForDisplay(s.dob)}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-medium">
                          {s.daysUntil === 1 ? "Tomorrow" : `in ${s.daysUntil} days`}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="pt-1">
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
