/**
 * Helper pagination untuk endpoint daftar (sesuai Swagger: query `page` default 1,
 * `limit` default 20; komentar default 10).
 * Bentuk respons yang belum sepenuhnya terverifikasi, jadi hasNext dibaca dari
 * `pagination.totalPages` bila ada; kalau tidak ada, dianggap masih ada halaman
 * selama jumlah item yang diterima sama dengan limit.
 */
export const PAGE_SIZE = 20;
export const COMMENT_PAGE_SIZE = 10;

type PagedMeta = { pagination?: { page?: number; totalPages?: number } };

export function hasNextPage(
  res: unknown,
  page: number,
  received: number,
  limit: number,
): boolean {
  const meta = (res as PagedMeta | null)?.pagination;
  if (meta && typeof meta.totalPages === "number") {
    return (meta.page ?? page) < meta.totalPages;
  }
  return received >= limit;
}

/** Gabungkan halaman dengan membuang duplikat berdasarkan id. */
export function uniqueById<T extends { id?: unknown }>(items: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    const key = String(item.id ?? "");
    if (key && seen.has(key)) continue;
    if (key) seen.add(key);
    out.push(item);
  }
  return out;
}

export type Paged<T> = { items: T[]; page: number; hasNext: boolean };

/** Bungkus satu halaman respons menjadi bentuk yang dipakai useInfiniteQuery. */
export function pageResult<T>(
  page: number,
  res: { items: T[]; raw: unknown },
  limit: number,
): Paged<T> {
  return { items: res.items, page, hasNext: hasNextPage(res.raw, page, res.items.length, limit) };
}
