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

export async function login(input: LoginInput): Promise<string> {
  const res = await apiFetch<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: input,
  });
  const token = res.token ?? res.accessToken;
  if (!token) {
    throw new Error("Token tidak ditemukan pada respons login.");
  }
  return token;
}

export function getMe(token: string) {
  return apiFetch<User & Record<string, unknown>>("/api/me", { token });
}
