"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

export function BirthdayCap({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "absolute -top-3.5 -right-2 z-20 block pointer-events-none select-none birthday-hat-animated drop-shadow-md",
        className
      )}
      title="Birthday Star! 🥳"
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-6 h-6"
      >
        {/* Pom-pom on hat tip */}
        <circle cx="24" cy="5" r="3.2" fill="#FBBF24" />
        <circle cx="24" cy="5" r="1.8" fill="#FFFBEB" />
        {/* Party cone hat */}
        <path
          d="M23 7L6 26C5 27.2 5.8 28.5 7.4 28.5L27 24C28.2 23.7 28.8 22.3 28 21.2L23 7Z"
          fill="url(#capGrad)"
        />
        {/* Hat stripes */}
        <path d="M10.5 24L24 20" stroke="#FDE68A" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M15.5 17.5L25 14.5" stroke="#60A5FA" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M19.5 11.5L24.5 10" stroke="#F472B6" strokeWidth="2" strokeLinecap="round" />
        {/* Rim bottom ruffle */}
        <ellipse cx="17" cy="26" rx="10.5" ry="2.2" fill="#EC4899" transform="rotate(-13 17 26)" opacity="0.95" />
        <defs>
          <linearGradient id="capGrad" x1="23" y1="7" x2="16" y2="28" gradientUnits="userSpaceOnUse">
            <stop stopColor="#8B5CF6" />
            <stop offset="0.5" stopColor="#EC4899" />
            <stop offset="1" stopColor="#F59E0B" />
          </linearGradient>
        </defs>
      </svg>
    </span>
  );
}

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  className?: string;
  isBirthday?: boolean;
}

export function Avatar({ name, className, isBirthday, ...props }: AvatarProps) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div
      className={cn(
        "relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground font-display font-semibold select-none",
        isBirthday && "ring-2 ring-amber-400/60 shadow-[0_0_12px_rgba(245,158,11,0.35)]",
        className
      )}
      {...props}
    >
      {initials}
      {isBirthday && <BirthdayCap />}
    </div>
  );
}
