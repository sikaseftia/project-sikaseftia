"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AuthGuard from "@/components/AuthGuard";
import UserList from "@/components/UserList";
import { searchUsers } from "@/features/users/api";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { useAppSelector } from "@/store/hooks";

function SearchContent() {
  const token = useAppSelector((state) => state.auth.token);
  const [input, setInput] = useState("");
  const query = useDebouncedValue(input.trim(), 300);
  const canSearch = query.length >= 2;

  const { data, error, isFetching } = useQuery({
    queryKey: ["search", query],
    queryFn: () => searchUsers(query, token),
    enabled: canSearch,
  });

  return (
    <section className="flex flex-col gap-4 p-6">
      <h1 className="text-base font-semibold">Search</h1>

      <input
        type="search"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Cari username atau nama"
        aria-label="Cari pengguna"
        className="h-11 rounded-full border border-neutral-800 bg-neutral-950 px-4 text-sm outline-none focus:border-violet-500"
      />

      {!canSearch && <p className="text-sm text-neutral-400">Ketik minimal 2 karakter untuk mencari.</p>}
      {canSearch && isFetching && <p className="text-sm text-neutral-400">Mencari…</p>}
      {canSearch && error && (
        <p role="alert" className="rounded-lg bg-red-950 px-3 py-2 text-sm text-red-300">
          {error.message}
        </p>
      )}
      {canSearch && data && !isFetching && (
        <UserList users={data} emptyText={`Tidak ada pengguna untuk "${query}".`} />
      )}
    </section>
  );
}

export default function SearchPage() {
  return (
    <AuthGuard>
      <SearchContent />
    </AuthGuard>
  );
}
