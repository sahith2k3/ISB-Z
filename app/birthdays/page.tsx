"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, Calendar, MapPin, Sparkles } from "lucide-react";
import { useLocalStudent } from "@/hooks/use-local-student";
import { useGetStudent, useGetUpcomingBirthdays } from "@/lib/api-client";
import { isStudentBirthdayToday, formatDobForDisplay } from "@/lib/birthday";
import { BirthdayName } from "@/components/birthday/birthday-name";
import { BirthdayWishButton } from "@/components/birthday/birthday-wish-button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { BottomNav } from "@/components/bottom-nav";
import { ShareButton } from "@/components/share-button";
import type { Campus } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function BirthdaysPage() {
  const { studentId: loggedInId } = useLocalStudent();
  const { data: me } = useGetStudent(loggedInId || 0);

  const effectiveUserCampus: Campus = (me?.campus || "hyderabad").toLowerCase() as Campus;
  const [selectedCampus, setSelectedCampus] = useState<Campus>(effectiveUserCampus);

  // Sync selected campus to user's campus ("You") as soon as user profile is loaded
  useEffect(() => {
    if (me?.campus) {
      setSelectedCampus(me.campus.toLowerCase() as Campus);
    }
  }, [me?.campus]);

  const { data, isLoading } = useGetUpcomingBirthdays(selectedCampus, 10);
  const students = data?.students ?? [];

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto overflow-x-hidden overflow-y-auto bg-background px-4 sm:px-5 pb-32 pt-6">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <Link
          href="/"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-card-border bg-card text-muted-foreground transition-all hover:text-foreground hover:border-primary/40"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-xl animate-cake-bounce-timed select-none">🎂</span>
          <h1 className="text-lg font-display font-bold text-foreground">
            Upcoming Birthdays
          </h1>
        </div>
        <ShareButton source="birthdays_page" />
      </div>

      {/* Description */}
      <p className="text-xs text-muted-foreground mb-4">
        Upcoming cohort birthdays so you never miss a chance to celebrate your classmates!
      </p>

      {/* Campus Switcher Tabs */}
      <div className="flex rounded-2xl bg-muted/60 p-1 mb-5 border border-border/50">
        <button
          type="button"
          onClick={() => setSelectedCampus("hyderabad")}
          className={cn(
            "flex-1 py-2 text-xs font-bold rounded-xl transition-all duration-200",
            selectedCampus === "hyderabad"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Hyderabad {effectiveUserCampus === "hyderabad" && "• You"}
        </button>
        <button
          type="button"
          onClick={() => setSelectedCampus("mohali")}
          className={cn(
            "flex-1 py-2 text-xs font-bold rounded-xl transition-all duration-200",
            selectedCampus === "mohali"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Mohali {effectiveUserCampus === "mohali" && "• You"}
        </button>
      </div>

      {/* Section Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-1.5 text-xs font-bold text-foreground capitalize">
          <MapPin className="h-3.5 w-3.5 text-pink-500" />
          <span>{selectedCampus} Campus</span>
        </div>
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-pink-600 dark:text-pink-400 bg-pink-500/10 px-2.5 py-0.5 rounded-full">
          <Sparkles className="h-3 w-3" /> Next 10 Birthdays
        </span>
      </div>

      {/* Birthdays List */}
      <div className="space-y-2.5">
        {isLoading ? (
          <div className="space-y-2.5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-16 rounded-2xl bg-muted/40 animate-pulse border border-border/40"
              />
            ))}
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-12 rounded-2xl border border-dashed border-card-border bg-card text-muted-foreground">
            <span className="text-3xl mb-2 block select-none">🎂</span>
            <p className="text-sm font-medium">No upcoming birthdays found</p>
          </div>
        ) : (
          students.map((student) => {
            const isToday = isStudentBirthdayToday(student);
            const isMe = student.id === loggedInId;

            return (
              <div
                key={student.id}
                className={cn(
                  "flex items-center justify-between gap-3 p-3 rounded-2xl border transition-all",
                  isToday
                    ? "border-pink-500/40 bg-gradient-to-r from-pink-500/10 via-purple-500/5 to-amber-500/10 shadow-sm"
                    : isMe
                    ? "border-primary/40 bg-primary/5"
                    : "border-card-border bg-card hover:border-pink-500/30"
                )}
              >
                <Link
                  href={`/student/${student.id}`}
                  className="flex items-center gap-3 min-w-0 flex-1 hover:opacity-90 transition-opacity"
                >
                  <div className="relative shrink-0">
                    <Avatar
                      name={student.name}
                      isBirthday={isToday}
                      className="h-11 w-11 text-xs shrink-0"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <h3 className="font-semibold text-sm text-foreground truncate">
                        <BirthdayName
                          name={student.name}
                          isBirthday={isToday}
                          showCake={isToday}
                        />
                      </h3>
                      {isMe && (
                        <Badge
                          variant="outline"
                          className="text-[9px] px-1 py-0 h-4 border-primary/40 text-primary shrink-0"
                        >
                          You
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1 truncate">
                        <Calendar className="h-3 w-3 text-muted-foreground shrink-0" />
                        {student.dob ? formatDobForDisplay(student.dob) : "Birthday"}
                      </span>
                      {student.section && (
                        <>
                          <span>•</span>
                          <span className="truncate">Sec {student.section}</span>
                        </>
                      )}
                    </div>
                  </div>
                </Link>

                <div className="flex items-center gap-2 shrink-0 pl-2">
                  {isToday ? (
                    <div className="flex items-center gap-1.5">
                      <Badge className="bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold text-[10px] px-2 py-0.5 border-0 shadow-sm animate-pulse">
                        Today! 🎂
                      </Badge>
                      {!isMe && loggedInId && (
                        <BirthdayWishButton
                          recipientId={student.id}
                          recipientName={student.name}
                          senderId={loggedInId}
                        />
                      )}
                    </div>
                  ) : (
                    <div className="text-right">
                      <p className="text-xs font-bold text-foreground">
                        {formatDobForDisplay(student.dob)}
                      </p>
                      <span className="text-[10px] font-semibold text-pink-600 dark:text-pink-400">
                        {student.daysUntil === 1
                          ? "Tomorrow"
                          : `in ${student.daysUntil} days`}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <BottomNav />
    </div>
  );
}
