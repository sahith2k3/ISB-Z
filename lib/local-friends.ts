// Sahith Madamanchi's student ID
export const SAHITH_STUDENT_ID = 62610342;

// Initial friendships are strictly reserved for Sahith only.
// No other student is permitted to import or receive pre-seeded friendships on login.
export const DEFAULT_FRIEND_IDS: Record<number, number[]> = {
  [SAHITH_STUDENT_ID]: [
    62610409, // Aditi Patel
    62610363, // Akash Kandakatla
    62610310, // Priya Ann Joseph
    62610181, // Sonali Jindal
    62610684, // Harsha Duttathreya K K
    62610173, // Shivaranjani Ramakrishnan
    62610185, // Dasari Monisha
    62610506, // Amritha Jayakanth
    62610488, // Vedika Viraj Sakhardande
    62610119, // NR
  ],
};

const STORAGE_PREFIX = "isbz_friends_";

export function getLocalFriendIds(studentId: number): number[] {
  if (typeof window === "undefined" || !studentId) {
    return studentId === SAHITH_STUDENT_ID ? (DEFAULT_FRIEND_IDS[SAHITH_STUDENT_ID] || []) : [];
  }

  const key = `${STORAGE_PREFIX}${studentId}`;
  const stored = window.localStorage.getItem(key);

  if (stored !== null) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // fallback
    }
  }

  // Only Sahith is allowed to import/seed friendships for the first time
  const initial = studentId === SAHITH_STUDENT_ID ? (DEFAULT_FRIEND_IDS[SAHITH_STUDENT_ID] || []) : [];
  try {
    window.localStorage.setItem(key, JSON.stringify(initial));
  } catch {
    // ignore quota/private browsing issues
  }
  return initial;
}

export function addLocalFriendId(studentId: number, friendId: number): number[] {
  const current = getLocalFriendIds(studentId);
  if (!current.includes(friendId)) {
    const updated = [...current, friendId];
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(`${STORAGE_PREFIX}${studentId}`, JSON.stringify(updated));
      } catch {}
    }
    return updated;
  }
  return current;
}

export function removeLocalFriendId(studentId: number, friendId: number): number[] {
  const current = getLocalFriendIds(studentId);
  const updated = current.filter((id) => id !== friendId);
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(`${STORAGE_PREFIX}${studentId}`, JSON.stringify(updated));
    } catch {}
  }
  return updated;
}