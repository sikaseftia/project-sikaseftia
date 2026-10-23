"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import AuthGuard from "@/components/AuthGuard";
import { getMe } from "@/features/auth/api";
import { ApiError } from "@/lib/api";
import { clearSession, writeStoredToken } from "@/store/authSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

function MeContent() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const token = useAppSelector((state) => state.auth.token);

  const { data, error } = useQuery({
    queryKey: ["me"],
    queryFn: () => getMe(token as string),
    enabled: Boolean(token),
  });

  // Token kedaluwarsa atau tidak valid: paksa logout supaya pengguna login ulang.
  useEffect(() => {
    if (error instanceof ApiError && error.status === 401) {
      writeStoredToken(null);
      dispatch(clearSession());
      queryClient.clear();
      router.replace("/login");
    }
  }, [error, dispatch, queryClient, router]);

  function handleLogout() {
    writeStoredToken(null);
    dispatch(clearSession());
    queryClient.clear();
    router.replace("/login");
  }

  return (
    <section className="flex flex-col gap-6 p-6">
      {error && !(error instanceof ApiError && error.status === 401) && (
        <p role="alert" className="rounded-lg bg-red-950 px-3 py-2 text-sm text-red-300">
          Profil gagal dimuat: {error.message}
        </p>
      )}

      {!data && !error && <p className="text-sm text-neutral-400">Memuat profil…</p>}

      {data && (
        <div className="flex flex-col gap-1">
          <h1 className="text-lg font-semibold">{data.name}</h1>
          <p className="text-sm text-neutral-400">@{data.username}</p>
          {data.bio && <p className="mt-2 text-sm">{data.bio}</p>}
        </div>
      )}

      <button
        type="button"
        onClick={handleLogout}
        className="h-11 rounded-full border border-neutral-700 text-sm"
      >
        Logout
      </button>

      {/* Hanya untuk verifikasi bentuk respons di tahap pengembangan. Dihapus setelah stabil. */}
      {process.env.NODE_ENV === "development" && data && (
        <details className="text-xs text-neutral-500">
          <summary>Debug: respons /api/me</summary>
          <pre className="mt-2 overflow-x-auto">{JSON.stringify(data, null, 2)}</pre>
        </details>
      )}
    </section>
  );
}

export default function MePage() {
  return (
    <AuthGuard>
      <MeContent />
    </AuthGuard>
  );
}
