import { apiFetch } from "@/lib/api";

export type UserSummary = {
  id: number | string;
  name: string;
  username: string;
  avatarUrl?: string | null;
  bio?: string | null;
};

export type UserProfile = UserSummary & {
  phone?: string | null;
  postsCount?: number;
  followersCount?: number;
  followingCount?: number;
  isFollowing?: boolean;
  followedByMe?: boolean;
  isMe?: boolean;
};

export type ProfileUpdateInput = {
  name?: string;
  username?: string;
  phone?: string;
  bio?: string;
  avatarUrl?: string;
};

/**
 * CATATAN: Bentuk respons daftar belum terverifikasi dari Swagger.
 * Helper ini menerima array langsung atau array yang dibungkus di data / items / users / results.
 */
export function toList<T>(res: unknown): T[] {
  if (Array.isArray(res)) return res as T[];
  if (res && typeof res === "object") {
    const record = res as Record<string, unknown>;
    for (const key of ["data", "items", "users", "results", "posts", "feed", "comments"]) {
      if (Array.isArray(record[key])) return record[key] as T[];
    }
  }
  return [];
}

/**
 * Profil publik. Bentuknya belum terverifikasi: bisa datar, atau dibungkus { profile, stats }
 * seperti /api/me. Fungsi ini meratakannya ke satu bentuk yang sama.
 */
export async function getUser(username: string, token?: string | null): Promise<UserProfile> {
  // Bentuk nyata (dari Network tab): { id, name, username, ..., counts: { post, followers, following, likes }, isFollowing, isMe }
  type Counts = { post?: number; posts?: number; followers?: number; following?: number; likes?: number };
  const res = await apiFetch<
    Partial<UserProfile> & { profile?: Partial<UserProfile>; stats?: Counts; counts?: Counts }
  >(`/api/users/${encodeURIComponent(username)}`, { token });

  // Profil publik tidak boleh membawa email dan nomor HP, jadi keduanya dibuang di sini.
  const p = { ...(res.profile ?? res) } as UserProfile & { email?: string };
  delete p.email;
  delete p.phone;
  const counts = res.counts ?? res.stats;

  return {
    ...p,
    postsCount: counts?.post ?? counts?.posts ?? p.postsCount,
    followersCount: counts?.followers ?? p.followersCount,
    followingCount: counts?.following ?? p.followingCount,
    isFollowing: Boolean(res.isFollowing ?? res.followedByMe ?? p.isFollowing ?? p.followedByMe),
    isMe: res.isMe ?? p.isMe,
  };
}

/**
 * Update profil (PATCH /api/me). Sesuai Swagger: multipart/form-data dengan field
 * name, username, phone, bio, dan avatar (PNG/JPG/WEBP, maks 5MB).
 * Jika ada file avatar, semua field dikirim sebagai multipart; jika tidak, cukup field teks.
 */
export function updateMe(token: string, input: ProfileUpdateInput & { avatar?: File | null }) {
  const { avatar, ...fields } = input;
  if (avatar) {
    const form = new FormData();
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) form.append(key, value);
    }
    form.append("avatar", avatar);
    return apiFetch<UserProfile>("/api/me", { method: "PATCH", token, body: form });
  }
  return apiFetch<UserProfile>("/api/me", { method: "PATCH", token, body: fields });
}

export function searchUsers(q: string, token?: string | null) {
  return apiFetch<unknown>(`/api/users/search?q=${encodeURIComponent(q)}`, { token }).then(
    (res) => toUserSummaries(res),
  );
}

export function getFollowersPage(username: string, page: number, limit: number, token?: string | null) {
  return apiFetch<unknown>(
    `/api/users/${encodeURIComponent(username)}/followers?page=${page}&limit=${limit}`,
    { token },
  ).then((res) => ({ items: toUserSummaries(res), raw: res }));
}

export function getFollowingPage(username: string, page: number, limit: number, token?: string | null) {
  return apiFetch<unknown>(
    `/api/users/${encodeURIComponent(username)}/following?page=${page}&limit=${limit}`,
    { token },
  ).then((res) => ({ items: toUserSummaries(res), raw: res }));
}

/** Array pertama yang ditemukan di dalam respons, apa pun nama kuncinya (data, following, dll.). */
function findArray(res: unknown): unknown[] {
  if (Array.isArray(res)) return res;
  if (res && typeof res === "object") {
    for (const value of Object.values(res as Record<string, unknown>)) {
      if (Array.isArray(value)) return value;
    }
  }
  return [];
}

/** Ambil objek user dari satu item. Mendukung item datar maupun item yang membungkus user di dalam field lain. */
function pickUser(item: unknown): UserSummary | null {
  if (!item || typeof item !== "object") return null;
  const record = item as Record<string, unknown>;
  if (typeof record.username === "string") return record as unknown as UserSummary;
  for (const value of Object.values(record)) {
    if (value && typeof value === "object" && typeof (value as Record<string, unknown>).username === "string") {
      return value as UserSummary;
    }
  }
  return null;
}

/** Daftar user dari respons follow / followers / following / search, dengan bentuk apa pun. */
export function toUserSummaries(res: unknown): UserSummary[] {
  return findArray(res)
    .map(pickUser)
    .filter((user): user is UserSummary => user !== null);
}
