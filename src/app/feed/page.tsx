"use client";

import { useQuery } from "@tanstack/react-query";
import AuthGuard from "@/components/AuthGuard";
import PostCard from "@/components/PostCard";
import { getFeed } from "@/features/posts/feed";
import { useAppSelector } from "@/store/hooks";

function FeedContent() {
  const token = useAppSelector((state) => state.auth.token);

  const { data, error, isPending, refetch, isFetching } = useQuery({
    queryKey: ["feed"],
    queryFn: () => getFeed(token as string),
    enabled: Boolean(token),
  });

  if (isPending) {
    return <p className="p-6 text-sm text-neutral-400">Memuat feed…</p>;
  }

  if (error) {
    return (
      <section className="flex flex-col gap-3 p-6">
        <p role="alert" className="rounded-lg bg-red-950 px-3 py-2 text-sm text-red-300">
          Feed gagal dimuat: {error.message}
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="h-10 rounded-full border border-neutral-700 text-sm disabled:opacity-60"
        >
          Coba lagi
        </button>
      </section>
    );
  }

  if (data.length === 0) {
    return (
      <section className="flex flex-col items-center gap-2 p-10 text-center">
        <p className="text-sm font-medium">Feed kamu masih kosong</p>
        <p className="text-sm text-neutral-400">
          Ikuti pengguna lain untuk melihat post mereka di sini.
        </p>
      </section>
    );
  }

  return (
    <section className="flex flex-col pt-2">
      {data.map((post) => (
        <PostCard key={String(post.id)} post={post} token={token} />
      ))}
    </section>
  );
}

export default function FeedPage() {
  return (
    <AuthGuard>
      <FeedContent />
    </AuthGuard>
  );
}
