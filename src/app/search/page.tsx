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
  // Kata kunci datang dari kolom Search di header, lewat URL: /search?q=...
  const params = useSearchParams();
  const query = (params.get("q") ?? "").trim();
  const canSearch = query.length >= 2;

  const { data, error, isFetching } = useQuery({
    queryKey: ["search", query],
    queryFn: () => searchUsers(query, token),
    enabled: canSearch,
  });

  return (
    <section className="flex flex-col gap-4 p-6">
      <h1 className="text-base font-semibold">Search</h1>

      {!canSearch && <p className="text-sm text-neutral-400">Ketik minimal 2 karakter di kolom Search, lalu tekan Enter.</p>}
      {canSearch && isFetching && <p className="text-sm text-neutral-400">Mencari…</p>}
      {canSearch && error && (
        <p role="alert" className="rounded-lg bg-red-950 px-3 py-2 text-sm text-red-300">
          {error.message}
        </p>
      )}
      {canSearch && data && !isFetching && (
        <UserList users={data} token={token} emptyText={`Tidak ada pengguna untuk "${query}".`} />
      )}
    </section>
  );
}

export default function SearchPage() {
  return (
    <AuthGuard>
      {/* useSearchParams membutuhkan Suspense di App Router. */}
      <Suspense fallback={<p className="p-6 text-sm text-neutral-400">Memuat…</p>}>
        <SearchContent />
      </Suspense>
    </AuthGuard>
  );
}
