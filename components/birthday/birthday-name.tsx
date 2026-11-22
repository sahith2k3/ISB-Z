"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface BirthdayNameProps {
  name: string;
  isBirthday?: boolean;
  className?: string;
  cakeClassName?: string;
  showCake?: boolean;
}

export function BirthdayName({
  name,
  isBirthday,
  className,
  cakeClassName,
  showCake = true,
}: BirthdayNameProps) {
  if (!isBirthday) {
    return <span className={className}>{name}</span>;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 tracking-tight",
        className
      )}
      title={`${name}'s Birthday Today! 🎂`}
    >
      <span className="birthday-name-rainbow font-bold truncate">{name}</span>
      {showCake && (
        <span
          className={cn(
            "birthday-cake-badge text-sm sm:text-base shrink-0 select-none",
            cakeClassName
          )}
          aria-label="Birthday Cake"
        >
          🎂
        </span>
      )}
    </span>
  );
}
