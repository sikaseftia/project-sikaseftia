import { apiFetch } from "@/lib/api";

export type UserSummary = {
  id: number | string;
  name: string;
  username: string;
  avatarUrl?: string | null;
  bio?: string | null;
};

export type UserProfile = UserSummary & {
  phone?: string | null;
  postsCount?: number;
  followersCount?: number;
  followingCount?: number;
  isFollowing?: boolean;
};

export type ProfileUpdateInput = {
  name?: string;
  username?: string;
  phone?: string;
  bio?: string;
  avatarUrl?: string;
};

/**
 * CATATAN: Bentuk respons daftar belum terverifikasi dari Swagger.
 * Helper ini menerima array langsung atau array yang dibungkus di data / items / users / results.
 */
export function toList<T>(res: unknown): T[] {
  if (Array.isArray(res)) return res as T[];
  if (res && typeof res === "object") {
    const record = res as Record<string, unknown>;
    for (const key of ["data", "items", "users", "results", "posts", "feed", "comments"]) {
      if (Array.isArray(record[key])) return record[key] as T[];
    }
  }
  return [];
}

export function getUser(username: string, token?: string | null) {
  return apiFetch<UserProfile>(`/api/users/${encodeURIComponent(username)}`, { token });
}

export function updateMe(token: string, input: ProfileUpdateInput) {
  return apiFetch<UserProfile>("/api/me", { method: "PATCH", token, body: input });
}

export function searchUsers(q: string, token?: string | null) {
  return apiFetch<unknown>(`/api/users/search?q=${encodeURIComponent(q)}`, { token }).then(
    (res) => toList<UserSummary>(res),
  );
}

export function getFollowers(username: string, token?: string | null) {
  return apiFetch<unknown>(`/api/users/${encodeURIComponent(username)}/followers`, { token }).then(
    (res) => toList<UserSummary>(res),
  );
}

export function getFollowing(username: string, token?: string | null) {
  return apiFetch<unknown>(`/api/users/${encodeURIComponent(username)}/following`, { token }).then(
    (res) => toList<UserSummary>(res),
  );
}
