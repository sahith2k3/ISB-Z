import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(timeStr: string) {
  // timeStr is "HH:MM" in 24h format
  const [h, m] = timeStr.split(":");
  const hours = parseInt(h, 10);
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${m} ${ampm}`;
}

export function isPlacementsWindow(): boolean {
  // Placement season active through Dec 10
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const month = parseInt(parts.find((p) => p.type === "month")?.value ?? "11", 10);
  const day = parseInt(parts.find((p) => p.type === "day")?.value ?? "22", 10);
  if (month === 11) return true;
  if (month === 12 && day <= 10) return true;
  return false;
}

export function getFreeStatusMessage(): string {
  if (isPlacementsWindow()) {
    return "Prepping Hard for Placements!!";
  }
  return "Free for the rest of the day";
}
