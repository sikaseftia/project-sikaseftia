const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

type RequestOptions = Omit<RequestInit, "body"> & {
  token?: string | null;
  body?: unknown;
};

/**
 * Satu pintu untuk semua request ke backend.
 * - Menambahkan header Authorization jika ada token.
 * - Melempar ApiError dengan status code supaya UI bisa menampilkan pesan yang tepat.
 */
export async function apiFetch<T>(
  path: string,
  { token, body, headers, ...init }: RequestOptions = {},
): Promise<T> {
  // FormData (upload file) dikirim apa adanya; browser otomatis memberi Content-Type multipart.
  const isForm = body instanceof FormData;
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      ...(body !== undefined && !isForm ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: isForm ? body : body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const raw = data?.message ?? data?.error ?? `Request gagal (${res.status})`;
    const message = Array.isArray(raw) ? raw.join(", ") : String(raw);
    throw new ApiError(res.status, message);
  }

  return data as T;
}
