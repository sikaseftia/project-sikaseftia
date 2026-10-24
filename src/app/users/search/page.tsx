"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import AuthGuard from "@/components/AuthGuard";
import UserList from "@/components/UserList";
import { searchUsers } from "@/features/users/api";
import { useAppSelector } from "@/store/hooks";

function SearchContent() {
  const token = useAppSelector((state) => state.auth.token);
  // Kata kunci datang dari kolom Cari di header, lewat URL: /users/search?q=...
  const params = useSearchParams();
  const query = (params.get("q") ?? "").trim();
  const canSearch = query.length >= 2;

  const { data, error, isFetching, refetch } = useQuery({
    queryKey: ["search", query],
    queryFn: () => searchUsers(query, token),
    enabled: canSearch,
  });

  return (
    <section className="flex flex-col gap-4 px-4 py-6 ">
      <h1 className="text-base font-semibold">Cari</h1>

      {!canSearch && (
        <p className="text-sm text-neutral-400">Ketik minimal 2 karakter di kolom Cari, lalu tekan Enter.</p>
      )}
      {canSearch && isFetching && <p className="text-sm text-neutral-400">Mencari…</p>}
      {canSearch && error && (
        <div className="flex flex-col gap-2">
          <p role="alert" className="rounded-lg bg-red-950 px-3 py-2 text-sm text-red-300">
            {error.message}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="h-10 rounded-full border border-neutral-700 text-sm"
          >
            Coba lagi
          </button>
        </div>
      )}
      {canSearch && data && !isFetching && data.length === 0 && (
        <div className="flex flex-col items-center gap-1 py-16 text-center">
          <p className="text-sm font-semibold">Tidak ditemukan</p>
          <p className="text-xs text-neutral-500">Ganti kata kunci kamu.</p>
        </div>
      )}
      {canSearch && data && !isFetching && data.length > 0 && <UserList users={data} token={token} emptyText="" />}
    </section>
  );
}

export default function UsersSearchPage() {
  return (
    <AuthGuard>
      {/* useSearchParams membutuhkan Suspense di App Router. */}
      <Suspense fallback={<p className="p-6 text-sm text-neutral-400">Memuat…</p>}>
        <SearchContent />
      </Suspense>
    </AuthGuard>
  );
}
