"use client";

import { useLocalStudent } from "@/hooks/use-local-student";
import { OnboardingView } from "@/components/views/onboarding-view";
import { HomeView } from "@/components/views/home-view";

export default function Page() {
  const { studentId } = useLocalStudent();

  if (!studentId) {
    return <OnboardingView />;
  }

  return <HomeView />;
}
