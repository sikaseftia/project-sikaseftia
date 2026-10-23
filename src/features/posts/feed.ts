import { apiFetch } from "@/lib/api";
import { toList } from "@/features/users/api";
import { normalizePost, type Post } from "@/features/posts/api";
import type { LikeablePost } from "@/features/likes/api";

function toPosts(res: unknown): LikeablePost[] {
  return toList<Post>(res).map(normalizePost) as LikeablePost[];
}

function timeOf(post: LikeablePost): number {
  const time = post.createdAt ? Date.parse(post.createdAt) : NaN;
  return Number.isNaN(time) ? 0 : time;
}

/**
 * Feed = post dari akun yang diikuti + post milik sendiri, tanpa duplikat, terbaru di atas.
 * /api/feed hanya berisi akun yang diikuti, jadi post sendiri diambil dari /api/me/posts.
 */
export async function getFeed(token: string): Promise<LikeablePost[]> {
  const [followed, mine] = await Promise.all([
    apiFetch<unknown>("/api/feed", { token }).then(toPosts),
    apiFetch<unknown>("/api/me/posts", { token }).then(toPosts),
  ]);

  const seen = new Set<string>();
  const merged: LikeablePost[] = [];
  for (const post of [...mine, ...followed]) {
    const key = String(post.id);
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(post);
    }
  }

  // sort() bersifat stabil: jika tidak ada createdAt, urutan awal (post sendiri dulu) tetap dipakai.
  return merged.sort((a, b) => timeOf(b) - timeOf(a));
}
