import { apiFetch } from "@/lib/api";
import { toList } from "@/features/users/api";

export type PostAuthor = {
  id?: number | string;
  name?: string;
  username: string;
  avatarUrl?: string | null;
};

/** Bentuk post sesuai respons backend (sudah diverifikasi dari Network tab). */
export type Post = {
  id: number | string;
  imageUrl?: string;
  image?: string;
  caption?: string | null;
  createdAt?: string;
  author?: PostAuthor;
  user?: PostAuthor;
  likesCount?: number;
  likeCount?: number;
  commentsCount?: number;
  commentCount?: number;
  isLiked?: boolean;
  likedByMe?: boolean;
  isSaved?: boolean;
  savedByMe?: boolean;
};

/** Menyamakan nama field backend (likeCount, likedByMe, savedByMe) dengan nama yang dipakai di UI. */
export function normalizePost(raw: Post): Post & {
  likesCount: number;
  isLiked: boolean;
  isSaved: boolean;
  commentsCount: number;
} {
  return {
    ...raw,
    likesCount: raw.likesCount ?? raw.likeCount ?? 0,
    isLiked: Boolean(raw.isLiked ?? raw.likedByMe),
    isSaved: Boolean(raw.isSaved ?? raw.savedByMe),
    commentsCount: raw.commentsCount ?? raw.commentCount ?? 0,
  };
}

export function getPostImage(post: Post): string | undefined {
  return post.imageUrl ?? post.image;
}

export function getPostAuthor(post: Post): PostAuthor | undefined {
  return post.author ?? post.user;
}
/** Post milik pengguna yang sedang login. */
export function getMyPosts(token: string) {
  return apiFetch<unknown>("/api/me/posts", { token }).then((res) =>
    toList<Post>(res).map(normalizePost),
  );
}

export function createPost(token: string, input: { image: File; caption: string }) {
  const form = new FormData();
  form.append("image", input.image);
  form.append("caption", input.caption);
  return apiFetch<unknown>("/api/posts", { method: "POST", token, body: form });
}

export function getPost(id: string, token?: string | null) {
  return apiFetch<Post>(`/api/posts/${encodeURIComponent(id)}`, { token }).then(normalizePost);
}

export function deletePost(id: string, token: string) {
  return apiFetch<unknown>(`/api/posts/${encodeURIComponent(id)}`, { method: "DELETE", token });
}
