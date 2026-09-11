// Default initial seeds for friendships from verified records
export const DEFAULT_FRIEND_IDS: Record<number, number[]> = {
  62610488: [62610778, 62610506, 62610342, 62610409, 62610363],
  62610506: [62610488, 62610778, 62610670, 62610131, 62610223, 62610742, 62610331],
  62510172: [62610103, 62610019],
  62610181: [62610349],
  62610742: [62610223, 62610202, 62610254, 62610671, 62610545, 62610566, 62610405],
  62610409: [62610363, 62610310, 62610218, 62610181, 62610800, 62610342, 62610384, 62610678],
  62610310: [62610363, 62610119, 62610409, 62610342, 62610181],
  62610331: [62610223],
  62610342: [62610409, 62610363, 62610310, 62610181, 62610684, 62610173, 62610185, 62610506, 62610488, 62610119],
  62610223: [62610202, 62610254, 62610742],
};

const STORAGE_PREFIX = "isbz_friends_";

export function getLocalFriendIds(studentId: number): number[] {
  if (typeof window === "undefined" || !studentId) {
    return DEFAULT_FRIEND_IDS[studentId] || [];
  }
  const key = `${STORAGE_PREFIX}${studentId}`;
  const stored = window.localStorage.getItem(key);
  if (stored !== null) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // fallback to defaults
    }
  }
  // Initialize with defaults if available
  const defaults = DEFAULT_FRIEND_IDS[studentId] || [];
  try {
    window.localStorage.setItem(key, JSON.stringify(defaults));
  } catch {
    // ignore quota/private browsing issues
  }
  return defaults;
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