import { apiFetch } from "@/lib/api";

export type User = {
  id: number | string;
  name: string;
  username: string;
  email?: string;
  bio?: string | null;
  avatarUrl?: string | null;
};

export type RegisterInput = {
  name: string;
  username: string;
  email: string;
  phone?: string;
  password: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

/**
 * CATATAN: Bentuk respons JSON belum terverifikasi dari Swagger.
 * Kita hanya butuh token. Jika backend memakai nama lain
 * (misalnya accessToken), cukup ubah baris "const token" di bawah.
 */
type LoginResponse = {
  token?: string;
  accessToken?: string;
};

export function register(input: RegisterInput) {
  return apiFetch<unknown>("/api/auth/register", {
    method: "POST",
    body: input,
  });
}

/** Mencari token di beberapa nama field yang umum dipakai backend. */
function pickToken(res: Record<string, unknown>): string | null {
  const nested = res.data && typeof res.data === "object" ? (res.data as Record<string, unknown>) : {};
  const candidates = [res.token, res.accessToken, res.access_token, nested.token, nested.accessToken];
  const found = candidates.find((value) => typeof value === "string" && value.length > 0);
  return typeof found === "string" ? found : null;
}

export async function login(input: LoginInput): Promise<string> {
  const res = await apiFetch<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: input,
  });
  const body = (res ?? {}) as Record<string, unknown>;
  const token = pickToken(body);
  if (!token) {
    // Tampilkan nama field yang dikirim backend supaya mudah dicocokkan.
    const keys = Object.keys(body).join(", ") || "(kosong)";
    throw new Error(`Token tidak ditemukan. Field respons login: ${keys}`);
  }
  return token;
}

/** Respons /api/me (sudah diverifikasi dari Network tab): { profile: {...}, stats: {...} }. */
type MeResponse = {
  profile: User & { phone?: string | null };
  stats?: { posts?: number; followers?: number; following?: number; likes?: number };
};

export async function getMe(token: string): Promise<User & Record<string, unknown>> {
  const res = await apiFetch<MeResponse>("/api/me", { token });

  // Ratakan profile + stats supaya komponen bisa memakai nama field yang sama.
  return {
    ...res.profile,
    postsCount: res.stats?.posts,
    followersCount: res.stats?.followers,
    followingCount: res.stats?.following,
    likesCount: res.stats?.likes,
  };
}
