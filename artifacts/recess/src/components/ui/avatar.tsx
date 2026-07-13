import * as React from "react"
import { cn } from "@/lib/utils"

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string
  className?: string
}

export function Avatar({ name, className, ...props }: AvatarProps) {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div
      className={cn(
        "flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground font-display font-semibold select-none",
        className
      )}
      {...props}
    >
      {initials}
    </div>
  )
}
