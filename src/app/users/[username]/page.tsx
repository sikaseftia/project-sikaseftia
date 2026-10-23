"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ApiError, apiFetch } from "@/lib/api";
import { getUser, toList } from "@/features/users/api";
import { useAppSelector } from "@/store/hooks";

type Tab = "posts" | "likes";

type PostThumb = {
  id: number | string;
  imageUrl?: string;
  image?: string;
  caption?: string;
};

/** Halaman profil publik. Bisa dibuka tanpa login. */
export default function PublicProfilePage() {
  const params = useParams<{ username: string }>();
  const username = decodeURIComponent(params.username);
  const token = useAppSelector((state) => state.auth.token);
  const [tab, setTab] = useState<Tab>("posts");

  const profile = useQuery({
    queryKey: ["user", username, token ?? "guest"],
    queryFn: () => getUser(username, token),
  });

  const tabItems = useQuery({
    queryKey: ["user", username, tab],
    queryFn: () =>
      apiFetch<unknown>(`/api/users/${encodeURIComponent(username)}/${tab}`, { token }).then(
        (res) => toList<PostThumb>(res),
      ),
  });

  if (profile.isPending) {
    return <p className="p-6 text-sm text-neutral-400">Memuat profil…</p>;
  }

  if (profile.error) {
    const notFound = profile.error instanceof ApiError && profile.error.status === 404;
    return (
      <section className="p-6">
        <p role="alert" className="rounded-lg bg-red-950 px-3 py-2 text-sm text-red-300">
          {notFound ? "Pengguna tidak ditemukan." : `Profil gagal dimuat: ${profile.error.message}`}
        </p>
      </section>
    );
  }

  const user = profile.data;

  return (
    <section className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-4">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-800 text-xl font-semibold">
          {user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
          ) : (
            user.name.charAt(0).toUpperCase()
          )}
        </span>
        <div className="flex flex-col">
          <h1 className="text-lg font-semibold">{user.name}</h1>
          <p className="text-sm text-neutral-400">@{user.username}</p>
        </div>
      </div>

      {user.bio && <p className="text-sm">{user.bio}</p>}

      <div className="flex justify-around border-y border-neutral-900 py-3 text-center text-sm">
        <div>
          <p className="font-semibold">{user.postsCount ?? "–"}</p>
          <p className="text-neutral-400">Posts</p>
        </div>
        <Link href={`/users/${user.username}/followers`}>
          <p className="font-semibold">{user.followersCount ?? "–"}</p>
          <p className="text-neutral-400">Followers</p>
        </Link>
        <Link href={`/users/${user.username}/following`}>
          <p className="font-semibold">{user.followingCount ?? "–"}</p>
          <p className="text-neutral-400">Following</p>
        </Link>
      </div>

      <div className="flex gap-2" role="tablist">
        {(["posts", "likes"] as const).map((item) => (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={tab === item}
            onClick={() => setTab(item)}
            className={`flex-1 rounded-full py-2 text-sm capitalize ${
              tab === item ? "bg-violet-600" : "border border-neutral-800 text-neutral-300"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      {tabItems.isPending && <p className="text-sm text-neutral-400">Memuat…</p>}
      {tabItems.error && (
        <p role="alert" className="rounded-lg bg-red-950 px-3 py-2 text-sm text-red-300">
          {tabItems.error.message}
        </p>
      )}
      {tabItems.data && tabItems.data.length === 0 && (
        <p className="text-sm text-neutral-400">
          {tab === "posts" ? "Belum ada post." : "Belum ada post yang disukai."}
        </p>
      )}
      {tabItems.data && tabItems.data.length > 0 && (
        <div className="grid grid-cols-3 gap-1">
          {tabItems.data.map((post) => {
            const src = post.imageUrl ?? post.image;
            return (
              <Link
                key={post.id}
                href={`/posts/${post.id}`}
                className="aspect-square overflow-hidden bg-neutral-900"
              >
                {src && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={src} alt={post.caption ?? "Post"} className="h-full w-full object-cover" />
                )}
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
