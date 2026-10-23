"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import AuthGuard from "@/components/AuthGuard";
import { getMe } from "@/features/auth/api";
import { getMyPosts, getPostImage } from "@/features/posts/api";
import { ApiError } from "@/lib/api";
import { clearSession, writeStoredToken } from "@/store/authSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

function Stat({ value, label }: { value: number | string; label: string }) {
  return (
    <span className="flex flex-col items-center gap-0.5">
      <span className="text-sm font-semibold">{value}</span>
      <span className="text-xs text-neutral-500">{label}</span>
    </span>
  );
}

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

  const myPosts = useQuery({
    queryKey: ["my-posts"],
    queryFn: () => getMyPosts(token as string),
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

  const extra = data as Record<string, unknown> | undefined;
  const initial = data?.name?.charAt(0).toUpperCase() ?? "?";

  return (
    <section className="flex flex-col gap-5 px-4 py-5">
      {error && !(error instanceof ApiError && error.status === 401) && (
        <p role="alert" className="rounded-lg bg-red-950 px-3 py-2 text-sm text-red-300">
          Profil gagal dimuat: {error.message}
        </p>
      )}

      {!data && !error && <p className="text-sm text-neutral-400">Memuat profil…</p>}

      {data && (
        <>
          {/* Figma: avatar + nama, lalu tombol Edit Profile dan ikon bagikan. */}
          <div className="flex items-center gap-3">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-800 text-lg font-semibold">
              {data.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={data.avatarUrl as string} alt={data.name} className="h-full w-full object-cover" />
              ) : (
                initial
              )}
            </span>
            <div className="flex min-w-0 flex-1 flex-col">
              <h1 className="truncate text-sm font-semibold">{data.name}</h1>
              <p className="truncate text-xs text-neutral-400">@{data.username}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/me/edit"
              className="flex h-9 flex-1 items-center justify-center rounded-lg border border-neutral-700 text-sm font-medium"
            >
              Edit Profile
            </Link>
            <ShareButton username={data.username} />
          </div>

          {data.bio && <p className="text-sm leading-relaxed text-neutral-200">{data.bio}</p>}

          <div className="grid grid-cols-4 py-1 text-center">
            <Stat value={myPosts.data?.length ?? "–"} label="Post" />
            <Link href="/me/followers">
              <Stat value={(extra?.followersCount as number | undefined) ?? "–"} label="Followers" />
            </Link>
            <Link href="/me/following">
              <Stat value={(extra?.followingCount as number | undefined) ?? "–"} label="Following" />
            </Link>
            <Link href="/me/likes">
              <Stat value={(extra?.likesCount as number | undefined) ?? "–"} label="Likes" />
            </Link>
          </div>
        </>
      )}

      {/* Tab Gallery dan Liked dengan ikon (Figma). */}
      <div className="flex border-b border-neutral-900 text-sm" role="tablist">
        <span className="flex flex-1 items-center justify-center gap-1.5 border-b-2 border-brand py-2.5 font-medium">
          <GridIcon /> Gallery
        </span>
        <Link href="/me/likes" className="flex flex-1 items-center justify-center gap-1.5 py-2.5 text-neutral-500">
          <HeartIcon /> Liked
        </Link>
      </div>

      {myPosts.error && (
        <p role="alert" className="rounded-lg bg-red-950 px-3 py-2 text-sm text-red-300">
          Post gagal dimuat: {myPosts.error.message}
        </p>
      )}

      {myPosts.data && myPosts.data.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <h2 className="text-base font-semibold">Your story starts here</h2>
          <p className="max-w-[280px] text-xs leading-relaxed text-neutral-400">
            Share your first post and let the world see your moments, passions, and memories. Make this space truly yours.
          </p>
          <Link href="/posts/new" className="mt-3 flex h-10 items-center rounded-lg bg-brand px-5 text-sm font-medium">
            Upload My First Post
          </Link>
        </div>
      )}

      {myPosts.data && myPosts.data.length > 0 && (
        <div className="grid grid-cols-3 gap-1">
          {myPosts.data.map((post) => {
            const src = getPostImage(post);
            return (
              <Link
                key={String(post.id)}
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

      <button
        type="button"
        onClick={handleLogout}
        className="h-10 rounded-lg border border-neutral-700 text-sm"
      >
        Logout
      </button>
    </section>
  );
}

function GridIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z" />
    </svg>
  );
}

/** Tombol bagikan (ikon kertas pesawat, Figma). Belum punya aksi; hanya menyalin tautan profil. */
function ShareButton({ username }: { username: string }) {
  return (
    <button
      type="button"
      aria-label="Salin tautan profil"
      onClick={() => {
        if (typeof navigator !== "undefined" && navigator.clipboard) {
          navigator.clipboard.writeText(`${window.location.origin}/profile/${username}`).catch(() => undefined);
        }
      }}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-neutral-700"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
        <path d="M22 2 11 13" />
        <path d="M22 2 15 22l-4-9-9-4z" />
      </svg>
    </button>
  );
}

export default function MePage() {
  return (
    <AuthGuard>
      <MeContent />
    </AuthGuard>
  );
}
