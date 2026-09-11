"use client";

import { use, useMemo, useEffect } from "react";
import Link from "next/link";
import { useLocalStudent } from "@/hooks/use-local-student";
import {
  useGetStudent,
  useGetStudentStatus,
  useListFriends,
  useAddFriend,
  useRemoveFriend,
  useLogProfileView,
} from "@/lib/api-client";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatTime } from "@/lib/utils";
import { ChevronLeft, MapPin, Users, UserPlus, UserMinus, Clock, School } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { StudentSchedule } from "@/components/student-schedule";
import { BottomNav } from "@/components/bottom-nav";

function formatDuration(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} min${minutes === 1 ? "" : "s"}`;
  if (minutes === 0) return `${hours} hr${hours === 1 ? "" : "s"}`;
  return `${hours} hr${hours === 1 ? "" : "s"} ${minutes} min${minutes === 1 ? "" : "s"}`;
}

export default function StudentProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const studentId = parseInt(resolvedParams.id || "0", 10);
  const { studentId: meId } = useLocalStudent();
  const { toast } = useToast();

  const isMe = studentId === meId;

  const { data: student, isLoading: studentLoading } = useGetStudent(studentId);
  const { data: status, isLoading: statusLoading } = useGetStudentStatus(studentId);
  const { data: friends } = useListFriends(meId);

  const isFriend = useMemo(
    () => friends?.some((f) => f.student.id === studentId),
    [friends, studentId],
  );

  const addFriendMutation = useAddFriend();
  const removeFriendMutation = useRemoveFriend();
  const logViewMutation = useLogProfileView();

  useEffect(() => {
    if (meId && studentId && meId !== studentId) {
      logViewMutation.mutate({ viewedId: studentId, viewerId: meId });
    }
  }, [meId, studentId]);

  const handleToggleFriend = async () => {
    if (!meId) return;

    if (isFriend) {
      removeFriendMutation.mutate(
        { id: meId, friendId: studentId },
        {
          onSuccess: () => {
            toast({ description: "Removed from friends" });
          },
          onError: () => {
            toast({ variant: "destructive", description: "Could not remove friend" });
          },
        },
      );
    } else {
      addFriendMutation.mutate(
        { id: meId, friendId: studentId },
        {
          onSuccess: () => {
            toast({ description: "Added to friends!" });
          },
          onError: () => {
            toast({ variant: "destructive", description: "Could not add friend" });
          },
        },
      );
    }
  };

  const isToggling = addFriendMutation.isPending || removeFriendMutation.isPending;

  if (studentLoading) {
    return (
      <div className="flex flex-col h-[100dvh] bg-background px-6 py-6">
        <Skeleton className="h-10 w-10 rounded-full mb-6" />
        <div className="flex items-center gap-4 mb-8">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <Skeleton className="h-24 w-full rounded-2xl mb-8" />
        <Skeleton className="h-8 w-32 mb-4" />
        <Skeleton className="h-20 w-full rounded-xl mb-3" />
        <Skeleton className="h-20 w-full rounded-xl mb-3" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex flex-col h-[100dvh] bg-background items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-display font-bold mb-2">Student not found</h2>
        <Link href="/" className="text-primary font-medium hover:underline">
          Go back home
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-background overflow-y-auto">
      <header className="px-6 py-6 flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur z-10">
        <Link
          href="/"
          className="h-10 w-10 flex items-center justify-center rounded-full bg-secondary text-secondary-foreground -ml-2"
        >
          <ChevronLeft className="h-6 w-6" />
        </Link>
        {!isMe && (
          <Button
            variant={isFriend ? "secondary" : "default"}
            size="sm"
            onClick={handleToggleFriend}
            disabled={isToggling}
            className="rounded-full font-semibold"
          >
            {isFriend ? (
              <>
                <UserMinus className="h-4 w-4 mr-2" /> Remove
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" /> Add Friend
              </>
            )}
          </Button>
        )}
      </header>

      <main className="px-6 pb-32">
        {/* Profile Header */}
        <div className="flex items-center gap-5 mb-8 mt-2">
          <Avatar name={student.name} className="h-24 w-24 text-2xl" />
          <div>
            <h1 className="text-3xl font-display font-bold leading-tight mb-1">
              {student.name}
            </h1>
            <p className="text-muted-foreground font-medium capitalize flex items-center gap-1.5">
              <MapPin className="h-4 w-4" /> {student.campus} • Sec {student.section}
            </p>
            {student.studyGroup && (
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                <Users className="h-4 w-4" /> SG {student.studyGroup}
              </p>
            )}
          </div>
        </div>

        {/* Live Status Card */}
        {statusLoading ? (
          <Skeleton className="h-32 w-full rounded-2xl mb-8" />
        ) : status ? (
          <div
            className={`relative overflow-hidden rounded-3xl p-6 mb-10 border shadow-sm ${
              status.isInClass
                ? "bg-card border-card-border"
                : "bg-free border-transparent text-free-foreground"
            }`}
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className={`h-3 w-3 rounded-full animate-pulse ${
                  status.isInClass ? "bg-destructive" : "bg-white/80"
                }`}
              />
              <span className="font-bold text-sm uppercase tracking-wider opacity-90">
                {status.isInClass ? "In Class Right Now" : "Free Right Now"}
              </span>
            </div>

            {status.isInClass && status.currentSession ? (
              <div>
                <h3 className="text-2xl font-display font-bold mb-1">
                  {status.currentSession.courseCode}
                </h3>
                <p className="opacity-80 flex items-center gap-1.5 mb-2">
                  <School className="h-4 w-4" />{" "}
                  {status.currentSession.room || "Room TBA"}
                </p>
                <div className="flex items-center gap-2 text-sm opacity-80 bg-background/50 text-foreground w-fit px-3 py-1 rounded-full">
                  <Clock className="h-4 w-4" /> Ends at{" "}
                  {formatTime(status.currentSession.endTime)}
                </div>
              </div>
            ) : status.nextSession ? (
              <div>
                <p className="text-lg font-medium opacity-90 mb-4">
                  Available for the next{" "}
                  {(() => {
                    const nowKolkata = new Date().toLocaleTimeString("en-US", {
                      hour12: false,
                      hour: "2-digit",
                      minute: "2-digit",
                      timeZone: "Asia/Kolkata",
                    });
                    const [nowH, nowM] = nowKolkata.split(":").map(Number);
                    const [nextH, nextM] = status.nextSession!.startTime
                      .split(":")
                      .map(Number);
                    const diffMinutes = Math.max(
                      1,
                      nextH * 60 + nextM - (nowH * 60 + nowM),
                    );
                    return formatDuration(diffMinutes);
                  })()}
                </p>
                <div className="flex items-center gap-2 text-sm opacity-90 bg-black/20 w-fit px-3 py-1 rounded-full">
                  <Clock className="h-4 w-4" /> Next class at{" "}
                  {formatTime(status.nextSession.startTime)}
                </div>
              </div>
            ) : (
              <div>
                <p className="text-lg font-medium opacity-90">
                  Done with classes for the day!
                </p>
              </div>
            )}
          </div>
        ) : null}

        <StudentSchedule studentId={studentId} />
      </main>
      <BottomNav />
    </div>
  );
}
