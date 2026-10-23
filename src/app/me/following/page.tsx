"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import AuthGuard from "@/components/AuthGuard";
import UserList from "@/components/UserList";
import { getMyFollowing } from "@/features/follow/api";
import { useAppSelector } from "@/store/hooks";

function MyFollowingContent() {
  const token = useAppSelector((state) => state.auth.token) as string;

  const { data, error, isPending } = useQuery({
    queryKey: ["my-following"],
    queryFn: () => getMyFollowing(token),
  });

  return (
    <section className="flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <Link href="/me" className="text-sm text-neutral-400">
          ← Profil
        </Link>
        <h1 className="text-base font-semibold">Following</h1>
        <span className="w-12" />
      </div>

      {isPending && <p className="text-sm text-neutral-400">Memuat…</p>}
      {error && (
        <p role="alert" className="rounded-lg bg-red-950 px-3 py-2 text-sm text-red-300">
          {error.message}
        </p>
      )}
      {data && <UserList users={data} emptyText="Belum mengikuti siapa pun." />}
    </section>
  );
}

export default function MyFollowingPage() {
  return (
    <AuthGuard>
      <MyFollowingContent />
    </AuthGuard>
  );
}
