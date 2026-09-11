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
  return useQuery({
    queryKey: getListFriendsQueryKey(studentId || 0),
    queryFn: () => fetchJson<FriendEntry[]>(`/api/students/${studentId}/friends`),
    enabled: typeof studentId === "number" && !isNaN(studentId) && studentId > 0,
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
      return fetchJson<FriendEntry>(`/api/students/${id}/friends`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendId }),
      });
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
      return fetchJson<void>(`/api/students/${id}/friends/${friendId}`, {
        method: "DELETE",
      });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: getListFriendsQueryKey(variables.id) });
    },
  });
}
