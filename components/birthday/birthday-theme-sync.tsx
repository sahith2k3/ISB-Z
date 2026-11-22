"use client";

import { useEffect } from "react";
import { useLocalStudent } from "@/hooks/use-local-student";
import { useGetStudent } from "@/lib/api-client";
import { isStudentBirthdayToday } from "@/lib/birthday";

export function BirthdayThemeSync() {
  const { studentId } = useLocalStudent();
  const { data: student } = useGetStudent(studentId || 0);

  const isBirthday = isStudentBirthdayToday(student);

  useEffect(() => {
    if (typeof document === "undefined") return;

    if (isBirthday) {
      document.body.classList.add("birthday-celebration-bg");
    } else {
      document.body.classList.remove("birthday-celebration-bg");
    }

    return () => {
      document.body.classList.remove("birthday-celebration-bg");
    };
  }, [isBirthday]);

  return null;
}
