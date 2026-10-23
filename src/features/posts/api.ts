import { apiFetch } from "@/lib/api";

export type PostAuthor = {
  id?: number | string;
  name?: string;
  username: string;
  avatarUrl?: string | null;
};

export type Post = {
  id: number | string;
  imageUrl?: string;
  image?: string;
  caption?: string | null;
  createdAt?: string;
  author?: PostAuthor;
  user?: PostAuthor;
  likesCount?: number;
  commentsCount?: number;
};

/**
 * CATATAN: Bentuk respons post belum terverifikasi dari Swagger.
 * Helper di bawah mencoba beberapa lokasi umum untuk id, gambar, dan penulis.
 */
export function getPostImage(post: Post): string | undefined {
  return post.imageUrl ?? post.image;
}

export function getPostAuthor(post: Post): PostAuthor | undefined {
  return post.author ?? post.user;
}

export function createPost(token: string, input: { image: File; caption: string }) {
  const form = new FormData();
  form.append("image", input.image);
  form.append("caption", input.caption);
  return apiFetch<unknown>("/api/posts", { method: "POST", token, body: form });
}

export function getPost(id: string, token?: string | null) {
  return apiFetch<Post>(`/api/posts/${encodeURIComponent(id)}`, { token });
}

export function deletePost(id: string, token: string) {
  return apiFetch<unknown>(`/api/posts/${encodeURIComponent(id)}`, { method: "DELETE", token });
}
