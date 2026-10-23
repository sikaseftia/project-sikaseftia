import { apiFetch } from "@/lib/api";
import { toList, type UserSummary } from "@/features/users/api";

/**
 * CATATAN: Endpoint dari daftar Swagger: /api/follow/{username}.
 * Diasumsikan POST untuk follow dan DELETE untuk unfollow. Perlu dicek ulang di Swagger.
 */
export function followUser(username: string, token: string) {
  return apiFetch<unknown>(`/api/follow/${encodeURIComponent(username)}`, {
    method: "POST",
    token,
  });
}

export function unfollowUser(username: string, token: string) {
  return apiFetch<unknown>(`/api/follow/${encodeURIComponent(username)}`, {
    method: "DELETE",
    token,
  });
}

/** Daftar followers dan following milik sendiri (/me/followers, /me/following). */
export function getMyFollowers(token: string) {
  return apiFetch<unknown>("/api/me/followers", { token }).then((res) =>
    toList<UserSummary>(res),
  );
}

export function getMyFollowing(token: string) {
  return apiFetch<unknown>("/api/me/following", { token }).then((res) =>
    toList<UserSummary>(res),
  );
}
