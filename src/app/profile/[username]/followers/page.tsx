"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import UserList from "@/components/UserList";
import { getFollowers } from "@/features/users/api";
import { useAppSelector } from "@/store/hooks";

export default function FollowersPage() {
  const params = useParams<{ username: string }>();
  const username = decodeURIComponent(params.username);
  const token = useAppSelector((state) => state.auth.token);

  const { data, error, isPending } = useQuery({
    queryKey: ["followers", username],
    queryFn: () => getFollowers(username, token),
  });

  return (
    <section className="flex flex-col gap-4 p-6">
      <Link href={`/profile/${username}`} className="text-sm text-neutral-400">
        ← @{username}
      </Link>
      <h1 className="text-base font-semibold">Followers</h1>

      {error && (
        <p role="alert" className="rounded-lg bg-red-950 px-3 py-2 text-sm text-red-300">
          {error.message}
        </p>
      )}
      {isPending && <p className="text-sm text-neutral-400">Memuat…</p>}
      {data && <UserList users={data} emptyText="Belum ada followers." />}
    </section>
  );
}
