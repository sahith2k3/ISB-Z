"use client";

import { useSyncExternalStore, useCallback } from "react";
import type { Campus } from "@/lib/types";

const STUDENT_ID_KEY = "recess_student_id";
const CAMPUS_KEY = "recess_campus";

type Listener = () => void;
const listeners = new Set<Listener>();

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emitChange() {
  for (const listener of listeners) listener();
}

function getStudentIdSnapshot(): number | null {
  if (typeof window === "undefined") return null;
  const saved = localStorage.getItem(STUDENT_ID_KEY);
  return saved ? parseInt(saved, 10) : null;
}

function getCampusSnapshot(): Campus | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(CAMPUS_KEY) as Campus | null;
}

export function useLocalStudent() {
  const studentId = useSyncExternalStore(subscribe, getStudentIdSnapshot, () => null);
  const campus = useSyncExternalStore(subscribe, getCampusSnapshot, () => null);

  const login = useCallback((id: number, c: Campus) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STUDENT_ID_KEY, id.toString());
      localStorage.setItem(CAMPUS_KEY, c);
      emitChange();
    }
  }, []);

  const logout = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(STUDENT_ID_KEY);
      localStorage.removeItem(CAMPUS_KEY);
      emitChange();
    }
  }, []);

  return { studentId, campus, login, logout };
}
