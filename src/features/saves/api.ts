import { apiFetch } from "@/lib/api";
import { toList } from "@/features/users/api";
import { normalizePost, type Post } from "@/features/posts/api";

/**
 * CATATAN: Endpoint dari daftar Swagger: /api/posts/{id}/save dan /api/me/saved.
 * Diasumsikan POST untuk simpan dan DELETE untuk batal simpan. Perlu dicek ulang di Swagger.
 */
export function savePost(postId: string, token: string) {
  return apiFetch<unknown>(`/api/posts/${encodeURIComponent(postId)}/save`, {
    method: "POST",
    token,
  });
}

export function unsavePost(postId: string, token: string) {
  return apiFetch<unknown>(`/api/posts/${encodeURIComponent(postId)}/save`, {
    method: "DELETE",
    token,
  });
}

export function getSavedPostsPage(token: string, page: number, limit: number) {
  return apiFetch<unknown>(`/api/me/saved?page=${page}&limit=${limit}`, { token }).then((res) => ({
    items: toList<Post>(res).map(normalizePost),
    raw: res,
  }));
}
