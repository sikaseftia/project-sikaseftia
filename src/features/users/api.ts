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

  const p = (res.profile ?? res) as UserProfile;
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

export function updateMe(token: string, input: ProfileUpdateInput) {
  return apiFetch<UserProfile>("/api/me", { method: "PATCH", token, body: input });
}

export function searchUsers(q: string, token?: string | null) {
  return apiFetch<unknown>(`/api/users/search?q=${encodeURIComponent(q)}`, { token }).then(
    (res) => toList<UserSummary>(res),
  );
}

export function getFollowers(username: string, token?: string | null) {
  return apiFetch<unknown>(`/api/users/${encodeURIComponent(username)}/followers`, { token }).then(
    (res) => toList<UserSummary>(res),
  );
}

export function getFollowing(username: string, token?: string | null) {
  return apiFetch<unknown>(`/api/users/${encodeURIComponent(username)}/following`, { token }).then(
    (res) => toList<UserSummary>(res),
  );
}
