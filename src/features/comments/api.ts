import { apiFetch } from "@/lib/api";
import { toList } from "@/features/users/api";
import type { PostAuthor } from "@/features/posts/api";

export type Comment = {
  id: number | string;
  content?: string;
  text?: string;
  comment?: string;
  createdAt?: string;
  author?: PostAuthor;
  user?: PostAuthor;
};

/**
 * CATATAN: Nama field isi komentar belum terverifikasi dari Swagger.
 * Request body memakai { text } (sudah dikonfirmasi dari pesan error backend);
 * respons dibaca dengan cadangan content / comment.
 */
export function getCommentText(comment: Comment): string {
  return comment.content ?? comment.text ?? comment.comment ?? "";
}

export function getCommentAuthor(comment: Comment): PostAuthor | undefined {
  return comment.author ?? comment.user;
}

export function getComments(postId: string, token?: string | null) {
  return apiFetch<unknown>(`/api/posts/${encodeURIComponent(postId)}/comments`, { token }).then(
    (res) => toList<Comment>(res),
  );
}

export function addComment(postId: string, text: string, token: string) {
  return apiFetch<unknown>(`/api/posts/${encodeURIComponent(postId)}/comments`, {
    method: "POST",
    token,
    body: { text },
  });
}

export function deleteComment(commentId: string, token: string) {
  return apiFetch<unknown>(`/api/comments/${encodeURIComponent(commentId)}`, {
    method: "DELETE",
    token,
  });
}
