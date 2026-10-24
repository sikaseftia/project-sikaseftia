"use client";

import { ErrorMessage, EmptyMessage, LoadingMessage } from "@/components/StateMessages";
import Link from "next/link";
import { useInfiniteQuery } from "@tanstack/react-query";
import LoadMoreButton from "@/components/LoadMoreButton";
import { PAGE_SIZE, pageResult } from "@/lib/paging";
import AuthGuard from "@/components/AuthGuard";
import UserList from "@/components/UserList";
import { getMyFollowingPage } from "@/features/follow/api";
import { useAppSelector } from "@/store/hooks";

function MyFollowingContent() {
  const token = useAppSelector((state) => state.auth.token) as string;

  const { error, isPending, refetch, isFetching, hasNextPage, isFetchingNextPage, fetchNextPage, data: pages } =
    useInfiniteQuery({
      queryKey: ["my-following"],
      queryFn: ({ pageParam }) =>
        getMyFollowingPage(token, pageParam, PAGE_SIZE).then((r) => pageResult(pageParam, r, PAGE_SIZE)),
      initialPageParam: 1,
      getNextPageParam: (last) => (last.hasNext ? last.page + 1 : undefined),
    });
  const data = pages?.pages.flatMap((p) => p.items);

  return (
    <section className="flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <Link href="/me" className="text-sm text-neutral-400">
          ← Profil
        </Link>
        <h1 className="text-base font-semibold">Mengikuti</h1>
        <span className="w-12" />
      </div>

      {isPending && <LoadingMessage />}
      {error && <ErrorMessage message={error.message} onRetry={() => refetch()} retrying={isFetching} />}
      {data && (
        <>
          <UserList users={data} emptyText="Belum mengikuti siapa pun." />
          <LoadMoreButton hasNext={Boolean(hasNextPage)} loading={isFetchingNextPage} onClick={() => fetchNextPage()} />
        </>
      )}
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
