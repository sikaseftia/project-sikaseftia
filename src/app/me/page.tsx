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

      {data && (
        <nav className="flex gap-3 text-sm">
          <Link href="/me/edit" className="flex-1 rounded-full border border-neutral-700 py-2 text-center">
            Edit profil
          </Link>
          <Link
            href={`/users/${data.username}`}
            className="flex-1 rounded-full border border-neutral-700 py-2 text-center"
          >
            Lihat profil publik
          </Link>
          <Link
            href="/me/likes"
            className="flex-1 rounded-full border border-neutral-700 py-2 text-center"
          >
            Liked
          </Link>
        </nav>
      )}

      {data && (
        <div className="flex justify-around border-y border-neutral-900 py-3 text-center text-sm">
          <div>
            <p className="font-semibold">{myPosts.data?.length ?? "–"}</p>
            <p className="text-neutral-400">Posts</p>
          </div>
          <Link href={`/users/${data.username}/followers`}>
            <p className="font-semibold">{(data as Record<string, unknown>).followersCount as number ?? "–"}</p>
            <p className="text-neutral-400">Followers</p>
          </Link>
          <Link href={`/users/${data.username}/following`}>
            <p className="font-semibold">{(data as Record<string, unknown>).followingCount as number ?? "–"}</p>
            <p className="text-neutral-400">Following</p>
          </Link>
        </div>
      )}

      {myPosts.error && (
        <p role="alert" className="rounded-lg bg-red-950 px-3 py-2 text-sm text-red-300">
          Post gagal dimuat: {myPosts.error.message}
        </p>
      )}
      {myPosts.data && myPosts.data.length === 0 && (
        <p className="text-sm text-neutral-400">Kamu belum punya post. Tekan + untuk membuat post pertama.</p>
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
