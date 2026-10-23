import { apiFetch } from "@/lib/api";

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
