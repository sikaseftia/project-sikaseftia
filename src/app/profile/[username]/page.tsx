"use client";

import { ErrorMessage, EmptyMessage, LoadingMessage } from "@/components/StateMessages";
import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api";
import LoadMoreButton from "@/components/LoadMoreButton";
import { PAGE_SIZE, pageResult } from "@/lib/paging";
import { getUserLikesPage } from "@/features/likes/api";
import { getUserPostsPage } from "@/features/posts/api";
import { getMe } from "@/features/auth/api";
import { useToggleFollow } from "@/features/follow/useToggleFollow";
import { getUser } from "@/features/users/api";
import { useAppSelector } from "@/store/hooks";
import { track } from "@/lib/analytics";
import ShareSheet from "@/components/ShareSheet";

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

  const tabQuery = useInfiniteQuery({
    queryKey: ["user-tab", username, tab, token ?? "guest"],
    queryFn: ({ pageParam }) =>
      (tab === "posts"
        ? getUserPostsPage(username, pageParam, PAGE_SIZE, token)
        : getUserLikesPage(username, pageParam, PAGE_SIZE, token)
      ).then((r) => pageResult(pageParam, r, PAGE_SIZE)),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.hasNext ? last.page + 1 : undefined),
  });
  const tabItems = {
    isPending: tabQuery.isPending,
    error: tabQuery.error,
    isFetching: tabQuery.isFetching,
    refetch: tabQuery.refetch,
    data: tabQuery.data?.pages.flatMap((p) => p.items) as PostThumb[] | undefined,
  };

  // Data akun sendiri, untuk menyembunyikan tombol Follow di profil sendiri.
  const me = useQuery({
    queryKey: ["me"],
    queryFn: () => getMe(token as string),
    enabled: Boolean(token),
  });

  const follow = useToggleFollow(username, token ?? "");

  if (profile.isPending) {
    return <p className="p-6 text-sm text-neutral-400">Memuat profil…</p>;
  }

  if (profile.error) {
    const notFound =
      profile.error instanceof ApiError && profile.error.status === 404;
    return (
      <section className="p-6">
        <p
          role="alert"
          className="rounded-lg bg-red-950 px-3 py-2 text-sm text-red-300"
        >
          {notFound
            ? "Pengguna tidak ditemukan."
            : `Profil gagal dimuat: ${profile.error.message}`}
        </p>
      </section>
    );
  }

  const user = profile.data;
  // Pakai isMe dari backend bila ada; cadangannya membandingkan username dengan akun login.
  const isOwnProfile =
    user.isMe ?? Boolean(me.data && me.data.username === user.username);

  return (
    <section className="flex flex-col gap-5 px-4 py-5">
      {/* Figma: avatar + nama, tombol Follow/Following, dan ikon bagikan. */}
      <div className="flex items-center gap-3">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-800 text-lg font-semibold">
          {user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="h-full w-full object-cover"
            />
          ) : (
            user.name.charAt(0).toUpperCase()
          )}
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <h1 className="truncate text-sm font-semibold">{user.name}</h1>
          <p className="truncate text-xs text-neutral-400">@{user.username}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {token && !isOwnProfile && (
          <button
            type="button"
            onClick={() => follow.mutate(Boolean(user.isFollowing))}
            disabled={follow.isPending}
            className={`flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full text-sm font-medium disabled:opacity-60 ${
              user.isFollowing ? "border border-neutral-700" : "bg-brand"
            }`}
          >
            {user.isFollowing && (
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                aria-hidden="true"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
            )}
            {follow.isPending
              ? "Memproses…"
              : user.isFollowing
                ? "Mengikuti"
                : "Ikuti"}
          </button>
        )}
        <ShareLink username={user.username} />
      </div>
      {follow.error && (
        <p
          role="alert"
          className="rounded-lg bg-red-950 px-3 py-2 text-sm text-red-300"
        >
          {follow.error.message}
        </p>
      )}

      {user.bio && (
        <p className="text-sm leading-relaxed text-neutral-200">{user.bio}</p>
      )}

      <div className="grid grid-cols-4 py-1 text-center">
        <span className="flex flex-col items-center gap-0.5">
          <span className="text-sm font-semibold">
            {user.postsCount ?? "–"}
          </span>
          <span className="text-xs text-neutral-500">Postingan</span>
        </span>
        <Link
          href={`/profile/${user.username}/followers`}
          className="flex flex-col items-center gap-0.5"
        >
          <span className="text-sm font-semibold">
            {user.followersCount ?? "–"}
          </span>
          <span className="text-xs text-neutral-500">Pengikut</span>
        </Link>
        <Link
          href={`/profile/${user.username}/following`}
          className="flex flex-col items-center gap-0.5"
        >
          <span className="text-sm font-semibold">
            {user.followingCount ?? "–"}
          </span>
          <span className="text-xs text-neutral-500">Mengikuti</span>
        </Link>
        <span className="flex flex-col items-center gap-0.5">
          <span className="text-sm font-semibold">
            {((user as Record<string, unknown>).likesCount as
              number | undefined) ?? "–"}
          </span>
          <span className="text-xs text-neutral-500">Suka</span>
        </span>
      </div>

      {/* Tab Gallery dan Liked dengan ikon (Figma). */}
      <div className="flex border-b border-neutral-900 text-sm" role="tablist">
        {(["posts", "likes"] as const).map((item) => (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={tab === item}
            onClick={() => setTab(item)}
            className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 ${
              tab === item
                ? "border-b-2 border-brand font-medium"
                : "text-neutral-500"
            }`}
          >
            {item === "posts" ? (
              <>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
                Galeri
              </>
            ) : (
              <>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill={tab === "likes" ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z" />
                </svg>
                Disukai
              </>
            )}
          </button>
        ))}
      </div>

      {tabItems.isPending && <LoadingMessage />}
      {tabItems.error && <ErrorMessage message={tabItems.error.message} onRetry={() => tabItems.refetch()} retrying={tabItems.isFetching} />}
      {tabItems.data && tabItems.data.length === 0 && (
        <EmptyMessage title={tab === "posts" ? "Belum ada post." : "Belum ada post yang disukai."} />
      )}
      {tabItems.data && tabItems.data.length > 0 && (
        <>
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
                  <img
                    src={src}
                    alt={post.caption ?? "Postingan"}
                    className="h-full w-full object-cover"
                  />
                )}
              </Link>
            );
          })}
        </div>
        <LoadMoreButton
          hasNext={Boolean(tabQuery.hasNextPage)}
          loading={tabQuery.isFetchingNextPage}
          onClick={() => tabQuery.fetchNextPage()}
        />
        </>
      )}
    </section>
  );
}

function ShareLink({ username }: { username: string }) {
  const token = useAppSelector((state) => state.auth.token);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        aria-label="Bagikan profil"
        onClick={() =>
          token ? setOpen(true) : router.push(`/login?returnTo=${encodeURIComponent(`/profile/${username}`)}`)
        }
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-neutral-700"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
          <path d="M22 2 11 13" />
          <path d="M22 2 15 22l-4-9-9-4z" />
        </svg>
      </button>
      {open && token && (
        <ShareSheet path={`/profile/${username}`} token={token} onClose={() => setOpen(false)} />
      )}
    </>
  );
}

