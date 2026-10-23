"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import AuthGuard from "@/components/AuthGuard";
import PostCard from "@/components/PostCard";
import { getFeedPage, mergeFeed } from "@/features/posts/feed";
import { useAppSelector } from "@/store/hooks";

function FeedContent() {
  const token = useAppSelector((state) => state.auth.token);

  const feed = useInfiniteQuery({
    queryKey: ["feed"],
    queryFn: ({ pageParam }) => getFeedPage(token as string, pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.hasNext ? last.page + 1 : undefined),
    enabled: Boolean(token),
  });

  if (feed.isPending) {
    return <p className="p-6 text-sm text-neutral-400">Memuat feed…</p>;
  }

  if (feed.error) {
    return (
      <section className="flex flex-col gap-3 p-6">
        <p role="alert" className="rounded-lg bg-red-950 px-3 py-2 text-sm text-red-300">
          Feed gagal dimuat: {feed.error.message}
        </p>
        <button
          type="button"
          onClick={() => feed.refetch()}
          disabled={feed.isFetching}
          className="h-10 rounded-full border border-neutral-700 text-sm disabled:opacity-60"
        >
          Coba lagi
        </button>
      </section>
    );
  }

  const posts = mergeFeed(feed.data.pages.flatMap((page) => page.items));

  if (posts.length === 0) {
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
      {posts.map((post) => (
        <PostCard key={String(post.id)} post={post} token={token} />
      ))}

      {feed.hasNextPage && (
        <div className="p-4">
          <button
            type="button"
            onClick={() => feed.fetchNextPage()}
            disabled={feed.isFetchingNextPage}
            className="h-10 w-full rounded-full border border-neutral-700 text-sm disabled:opacity-60"
          >
            {feed.isFetchingNextPage ? "Memuat…" : "Muat lebih banyak"}
          </button>
        </div>
      )}
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
