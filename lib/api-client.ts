"use client";

import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from "@tanstack/react-query";
import type {
  Student,
  StudentSummary,
  StudentStatus,
  FriendEntry,
  ScheduleDay,
  Campus,
} from "./types";
import {
  getLocalFriendIds,
  addLocalFriendId,
  removeLocalFriendId,
} from "./local-friends";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    let message = `Request failed: ${res.status} ${res.statusText}`;
    try {
      const err = await res.json();
      if (err?.error) message = err.error;
    } catch {
      // fallback to status text
    }
    throw new Error(message);
  }
  if (res.status === 204) {
    return null as T;
  }
  return res.json();
}

export const getListFriendsQueryKey = (studentId: number) => ["friends", studentId] as const;

export function useGetStudent(studentId: number | null | undefined) {
  return useQuery({
    queryKey: ["student", studentId],
    queryFn: () => fetchJson<Student>(`/api/students/${studentId}`),
    enabled: typeof studentId === "number" && !isNaN(studentId) && studentId > 0,
  });
}

export function useGetStudentStatus(studentId: number | null | undefined) {
  return useQuery({
    queryKey: ["studentStatus", studentId],
    queryFn: () => fetchJson<StudentStatus>(`/api/students/${studentId}/status`),
    enabled: typeof studentId === "number" && !isNaN(studentId) && studentId > 0,
    refetchInterval: 60 * 1000, // auto refresh live status every minute
  });
}

export function useListFriends(studentId: number | null | undefined) {
  const validId = typeof studentId === "number" && !isNaN(studentId) && studentId > 0;
  const friendIds = validId ? getLocalFriendIds(studentId) : [];

  return useQuery({
    queryKey: [...getListFriendsQueryKey(studentId || 0), friendIds.join(",")],
    queryFn: async () => {
      if (friendIds.length === 0) return [];
      return fetchJson<FriendEntry[]>(
        `/api/students/${studentId}/friends?ids=${friendIds.join(",")}`,
      );
    },
    enabled: validId,
    refetchInterval: 60 * 1000,
  });
}

export interface ListStudentsParams {
  campus?: Campus;
  search?: string;
  limit?: number;
}

export function useListStudents(
  params: ListStudentsParams,
  options?: {
    query?: {
      enabled?: boolean;
      queryKey?: any[];
    };
  },
) {
  const { campus, search, limit = 10 } = params;
  const searchParams = new URLSearchParams();
  if (campus) searchParams.set("campus", campus);
  if (search) searchParams.set("search", search);
  if (limit) searchParams.set("limit", limit.toString());

  const url = `/api/students?${searchParams.toString()}`;
  const defaultQueryKey = ["students", campus, search, limit];

  return useQuery({
    queryKey: options?.query?.queryKey ?? defaultQueryKey,
    queryFn: () => fetchJson<StudentSummary[]>(url),
    enabled: options?.query?.enabled ?? true,
  });
}

export function useGetStudentScheduleWorkingDays(studentId: number | null | undefined) {
  return useQuery({
    queryKey: ["studentScheduleWorkingDays", studentId],
    queryFn: () =>
      fetchJson<ScheduleDay[]>(`/api/students/${studentId}/schedule/working-days`),
    enabled: typeof studentId === "number" && !isNaN(studentId) && studentId > 0,
  });
}

export function useAddFriend() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, friendId }: { id: number; friendId: number }) => {
      // 1. Immediately update localStorage for 0ms UI responsiveness
      addLocalFriendId(id, friendId);

      // 2. Asynchronously sync/log friendship into PostgreSQL database
      try {
        await fetchJson<FriendEntry>(`/api/students/${id}/friends`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ friendId }),
        });
      } catch (err) {
        console.warn("Background DB friendship log warning:", err);
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: getListFriendsQueryKey(variables.id) });
    },
  });
}

export function useRemoveFriend() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, friendId }: { id: number; friendId: number }) => {
      // 1. Immediately update localStorage
      removeLocalFriendId(id, friendId);

      // 2. Asynchronously sync/log removal into PostgreSQL database
      try {
        await fetchJson<void>(`/api/students/${id}/friends/${friendId}`, {
          method: "DELETE",
        });
      } catch (err) {
        console.warn("Background DB friendship removal log warning:", err);
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: getListFriendsQueryKey(variables.id) });
    },
  });
}

export function useLogProfileView() {
  return useMutation({
    mutationFn: async ({ viewedId, viewerId }: { viewedId: number; viewerId: number }) => {
      if (!viewerId || !viewedId || viewerId === viewedId) return;
      return fetchJson<{ success: boolean; viewCount?: number }>(`/api/students/${viewedId}/view`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ viewerId }),
      });
    },
  });
}
