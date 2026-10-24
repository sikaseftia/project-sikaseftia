import { apiFetch } from "@/lib/api";
import { toList, toUserSummaries, type UserSummary } from "@/features/users/api";
import { normalizePost, type Post } from "@/features/posts/api";

/** Post yang sudah dinormalisasi: punya likesCount dan isLiked. */
export type LikeablePost = Post & {
  likesCount: number;
  isLiked: boolean;
};

export function isLikedByMe(post: LikeablePost): boolean {
  return post.isLiked;
}

/**
 * CATATAN: Pola endpoint diasumsikan dari daftar Swagger:
 * POST /like untuk menyukai, DELETE /like untuk batal. Perlu dicek ulang di Swagger.
 */
export function likePost(postId: string, token: string) {
  return apiFetch<unknown>(`/api/posts/${encodeURIComponent(postId)}/like`, {
    method: "POST",
    token,
  });
}

export function unlikePost(postId: string, token: string) {
  return apiFetch<unknown>(`/api/posts/${encodeURIComponent(postId)}/like`, {
    method: "DELETE",
    token,
  });
}

export function getPostLikers(postId: string, token?: string | null) {
  return apiFetch<unknown>(`/api/posts/${encodeURIComponent(postId)}/likes`, { token }).then(
    (res) => toUserSummaries(res),
  );
}

export function getMyLikesPage(token: string, page: number, limit: number) {
  return apiFetch<unknown>(`/api/me/likes?page=${page}&limit=${limit}`, { token }).then((res) => ({
    items: toList<Post>(res).map(normalizePost),
    raw: res,
  }));
}

export function getUserLikesPage(username: string, page: number, limit: number, token?: string | null) {
  return apiFetch<unknown>(
    `/api/users/${encodeURIComponent(username)}/likes?page=${page}&limit=${limit}`,
    { token },
  ).then((res) => ({ items: toList<Post>(res).map(normalizePost), raw: res }));
}
