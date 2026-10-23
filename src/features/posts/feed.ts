import { apiFetch } from "@/lib/api";
import { toList } from "@/features/users/api";
import { normalizePost, type Post } from "@/features/posts/api";
import type { LikeablePost } from "@/features/likes/api";

export const FEED_PAGE_SIZE = 20;

export type FeedPage = {
  items: LikeablePost[];
  page: number;
  hasNext: boolean;
};

function toPosts(res: unknown): LikeablePost[] {
  return toList<Post>(res).map(normalizePost) as LikeablePost[];
}

type PagedResponse = {
  items?: unknown[];
  pagination?: { page?: number; totalPages?: number };
};

/**
 * Satu halaman feed (20 post per halaman, sesuai PDF).
 * /api/feed hanya berisi akun yang diikuti, jadi post sendiri (/api/me/posts)
 * ikut diambil di halaman pertama saja. mergeFeed() membuang duplikatnya.
 */
export async function getFeedPage(token: string, page: number): Promise<FeedPage> {
  const [followed, mine] = await Promise.all([
    apiFetch<PagedResponse>(`/api/feed?page=${page}&limit=${FEED_PAGE_SIZE}`, { token }),
    page === 1
      ? apiFetch<unknown>(`/api/me/posts?limit=${FEED_PAGE_SIZE}`, { token }).then(toPosts)
      : Promise.resolve([] as LikeablePost[]),
  ]);

  const current = followed.pagination?.page ?? page;
  const total = followed.pagination?.totalPages ?? 1;

  return {
    items: [...mine, ...toPosts(followed)],
    page,
    hasNext: current < total,
  };
}

function timeOf(post: LikeablePost): number {
  const time = post.createdAt ? Date.parse(post.createdAt) : NaN;
  return Number.isNaN(time) ? 0 : time;
}

/** Gabungkan semua halaman: tanpa duplikat, terbaru di atas. */
export function mergeFeed(items: LikeablePost[]): LikeablePost[] {
  const seen = new Set<string>();
  const unique: LikeablePost[] = [];
  for (const post of items) {
    const key = String(post.id);
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(post);
    }
  }
  return unique.sort((a, b) => timeOf(b) - timeOf(a));
}
