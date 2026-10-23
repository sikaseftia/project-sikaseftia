"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import AuthGuard from "@/components/AuthGuard";
import { getPostImage } from "@/features/posts/api";
import { getSavedPosts } from "@/features/saves/api";
import { useAppSelector } from "@/store/hooks";

function SavedContent() {
  const token = useAppSelector((state) => state.auth.token) as string;

  const { data, error, isPending } = useQuery({
    queryKey: ["saved"],
    queryFn: () => getSavedPosts(token),
  });

  return (
    <section className="flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <Link href="/me" className="text-sm text-neutral-400">
          ← Profil
        </Link>
        <h1 className="text-base font-semibold">Saved</h1>
        <span className="w-12" />
      </div>

      {isPending && <p className="text-sm text-neutral-400">Memuat…</p>}
      {error && (
        <p role="alert" className="rounded-lg bg-red-950 px-3 py-2 text-sm text-red-300">
          {error.message}
        </p>
      )}
      {data && data.length === 0 && (
        <p className="text-sm text-neutral-400">Belum ada post yang disimpan.</p>
      )}
      {data && data.length > 0 && (
        <div className="grid grid-cols-3 gap-1">
          {data.map((post) => {
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
    </section>
  );
}

export default function SavedPage() {
  return (
    <AuthGuard>
      <SavedContent />
    </AuthGuard>
  );
}
