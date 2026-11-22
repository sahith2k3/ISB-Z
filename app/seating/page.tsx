"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SeatingRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/study-groups");
  }, [router]);

  return (
    <div className="flex h-[100dvh] items-center justify-center p-6 text-center bg-background">
      <div className="space-y-2">
        <p className="text-sm font-semibold text-foreground">
          Redirecting to Study Group Finder...
        </p>
        <p className="text-xs text-muted-foreground">
          Class lists and study groups are active
        </p>
      </div>
    </div>
  );
}
