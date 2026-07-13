import { useSyncExternalStore, useCallback } from 'react';

type Campus = 'hyderabad' | 'mohali';

const STUDENT_ID_KEY = 'recess_student_id';
const CAMPUS_KEY = 'recess_campus';

// Module-level store shared by every component that calls useLocalStudent,
// so an update in one component (e.g. onboarding) is immediately visible to
// every other subscriber (e.g. the router in App.tsx) rather than being
// trapped in that component's own local useState.
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
  const saved = localStorage.getItem(STUDENT_ID_KEY);
  return saved ? parseInt(saved, 10) : null;
}

function getCampusSnapshot(): Campus | null {
  return localStorage.getItem(CAMPUS_KEY) as Campus | null;
}

export function useLocalStudent() {
  const studentId = useSyncExternalStore(subscribe, getStudentIdSnapshot);
  const campus = useSyncExternalStore(subscribe, getCampusSnapshot);

  const login = useCallback((id: number, c: Campus) => {
    localStorage.setItem(STUDENT_ID_KEY, id.toString());
    localStorage.setItem(CAMPUS_KEY, c);
    emitChange();
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STUDENT_ID_KEY);
    localStorage.removeItem(CAMPUS_KEY);
    emitChange();
  }, []);

  return { studentId, campus, login, logout };
}
