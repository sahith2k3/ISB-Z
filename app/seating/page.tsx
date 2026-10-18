"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * TEMPORARY REDIRECT: /seating -> /
 * Note: The full seating page implementation is preserved in
 * app/seating/seating-page-preserved.tsx for restoring later.
 * 
 * If the user is signed in, / renders HomeView (main page).
 * If the user is not signed in (new user), / renders OnboardingView (signup).
 */
export default function SeatingRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/");
  }, [router]);

  return (
    <div className="flex h-[100dvh] items-center justify-center bg-background">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}
