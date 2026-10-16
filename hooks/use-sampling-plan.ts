"use client";

import { useState, useEffect, useCallback } from "react";
import type { SamplingSession, SamplingVerdict, SamplingVerdictStatus } from "@/lib/types";

const STORAGE_KEY_SAMPLED = "isbusy_sampling_planned_sessions";
const STORAGE_KEY_CHOICES = "isbusy_sampling_attending_choices";
const STORAGE_KEY_VERDICTS = "isbusy_sampling_course_verdicts";

export function useSamplingPlan(studentId: number | null | undefined) {
  const [sampledIds, setSampledIds] = useState<string[]>([]);
  const [attendingChoices, setAttendingChoices] = useState<Record<string, "allotted" | "sample">>({});
  const [verdicts, setVerdicts] = useState<Record<string, SamplingVerdict>>({});
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage
  useEffect(() => {
    if (!studentId || typeof window === "undefined") return;
    try {
      const savedSampled = window.localStorage.getItem(`${STORAGE_KEY_SAMPLED}:${studentId}`);
      if (savedSampled) setSampledIds(JSON.parse(savedSampled));

      const savedChoices = window.localStorage.getItem(`${STORAGE_KEY_CHOICES}:${studentId}`);
      if (savedChoices) setAttendingChoices(JSON.parse(savedChoices));

      const savedVerdicts = window.localStorage.getItem(`${STORAGE_KEY_VERDICTS}:${studentId}`);
      if (savedVerdicts) setVerdicts(JSON.parse(savedVerdicts));
    } catch (err) {
      console.warn("Failed to read sampling plan from storage", err);
    } finally {
      setIsLoaded(true);
    }
  }, [studentId]);

  // Persist sampled IDs
  const toggleSample = useCallback(
    (sessionId: string, slotKey?: string) => {
      if (!studentId || typeof window === "undefined") return;
      setSampledIds((prev) => {
        const next = prev.includes(sessionId)
          ? prev.filter((id) => id !== sessionId)
          : [...prev, sessionId];
        window.localStorage.setItem(`${STORAGE_KEY_SAMPLED}:${studentId}`, JSON.stringify(next));
        return next;
      });

      // If adding to a slot, default attending choice to sample
      if (slotKey) {
        setAttendingChoices((prev) => {
          const next = { ...prev, [slotKey]: "sample" as const };
          window.localStorage.setItem(`${STORAGE_KEY_CHOICES}:${studentId}`, JSON.stringify(next));
          return next;
        });
      }
    },
    [studentId]
  );

  const setChoice = useCallback(
    (slotKey: string, choice: "allotted" | "sample") => {
      if (!studentId || typeof window === "undefined") return;
      setAttendingChoices((prev) => {
        const next = { ...prev, [slotKey]: choice };
        window.localStorage.setItem(`${STORAGE_KEY_CHOICES}:${studentId}`, JSON.stringify(next));
        return next;
      });
    },
    [studentId]
  );

  const saveVerdict = useCallback(
    (courseCode: string, status: SamplingVerdictStatus, notes: string, rating?: number) => {
      if (!studentId || typeof window === "undefined") return;
      setVerdicts((prev) => {
        const next = {
          ...prev,
          [courseCode]: {
            status,
            notes,
            rating,
            updatedAt: new Date().toISOString(),
          },
        };
        window.localStorage.setItem(`${STORAGE_KEY_VERDICTS}:${studentId}`, JSON.stringify(next));
        return next;
      });
    },
    [studentId]
  );

  const isSampled = useCallback(
    (sessionId: string) => sampledIds.includes(sessionId),
    [sampledIds]
  );

  return {
    isLoaded,
    sampledIds,
    attendingChoices,
    verdicts,
    toggleSample,
    setChoice,
    saveVerdict,
    isSampled,
  };
}

// Generate .ics calendar string and download
export function downloadSamplingIcs(
  items: Array<{
    session: SamplingSession;
    type: "allotted" | "sample";
  }>,
  studentName = "Student"
) {
  if (items.length === 0) return;

  const pad = (n: number) => String(n).padStart(2, "0");

  let icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ISBusy//ISB Term 5 Sampling Planner//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:ISB Term 5 Sampling - ${studentName}`,
    "X-WR-TIMEZONE:Asia/Kolkata",
  ];

  for (const item of items) {
    const s = item.session;
    const isSample = item.type === "sample";
    const dateFormatted = s.date.replace(/-/g, "");
    const startFormatted = s.startTime.replace(/:/g, "") + "00";
    const endFormatted = s.endTime.replace(/:/g, "") + "00";

    const summary = `${isSample ? "[Sampling] " : "[Allotted] "}${s.courseName} (${s.courseCode} Sec ${s.section})`;
    const location = `${s.room}, ISB ${s.campus === "hyderabad" ? "Hyderabad" : "Mohali"}`;
    const description = `${summary}\\nVenue: ${s.room}\\nFaculty: ${s.faculty || "TBA"}\\nMode: ${isSample ? "Auditing / Sampling" : "Officially Allotted"}\\n\\nGenerated via ISBusy Sampling Planner`;

    icsContent.push(
      "BEGIN:VEVENT",
      `UID:${s.id}-${Date.now()}@isbusy.isb.edu`,
      `DTSTAMP:${dateFormatted}T${startFormatted}`,
      `DTSTART;TZID=Asia/Kolkata:${dateFormatted}T${startFormatted}`,
      `DTEND;TZID=Asia/Kolkata:${dateFormatted}T${endFormatted}`,
      `SUMMARY:${summary}`,
      `LOCATION:${location}`,
      `DESCRIPTION:${description}`,
      "STATUS:CONFIRMED",
      "BEGIN:VALARM",
      "TRIGGER:-PT15M",
      "ACTION:DISPLAY",
      `DESCRIPTION:Reminder: ${summary} in 15 mins`,
      "END:VALARM",
      "END:VEVENT"
    );
  }

  icsContent.push("END:VCALENDAR");

  const blob = new Blob([icsContent.join("\r\n")], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "ISB_Term5_Sampling_Schedule.ics";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Generate shareable text for WhatsApp / Clipboard
export function generateShareableText(
  items: Array<{
    session: SamplingSession;
    type: "allotted" | "sample";
  }>,
  studentName = "My"
): string {
  if (items.length === 0) return "No sampling sessions selected yet.";

  const day1 = items.filter((i) => i.session.date === "2026-10-19");
  const day2 = items.filter((i) => i.session.date === "2026-10-20");

  let out = `🎓 *${studentName} Term 5 Sampling Schedule*\n`;

  if (day1.length > 0) {
    out += `\n📅 *Day 1 — Mon, Oct 19:*\n`;
    for (const item of day1) {
      const badge = item.type === "sample" ? "🔍 [Sampling]" : "★ [Allotted]";
      out += `• ${item.session.startTime}-${item.session.endTime}: *${item.session.courseCode}* (Sec ${item.session.section}) @ ${item.session.room} ${badge}\n`;
    }
  }

  if (day2.length > 0) {
    out += `\n📅 *Day 2 — Tue, Oct 20:*\n`;
    for (const item of day2) {
      const badge = item.type === "sample" ? "🔍 [Sampling]" : "★ [Allotted]";
      out += `• ${item.session.startTime}-${item.session.endTime}: *${item.session.courseCode}* (Sec ${item.session.section}) @ ${item.session.room} ${badge}\n`;
    }
  }

  out += `\nShared via ISBusy • isb-z.vercel.app`;
  return out;
}
