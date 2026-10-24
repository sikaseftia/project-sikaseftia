"use client";

import { ErrorMessage, EmptyMessage, LoadingMessage } from "@/components/StateMessages";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useInfiniteQuery } from "@tanstack/react-query";
import LoadMoreButton from "@/components/LoadMoreButton";
import { PAGE_SIZE, pageResult } from "@/lib/paging";
import UserList from "@/components/UserList";
import { getFollowingPage } from "@/features/users/api";
import { useAppSelector } from "@/store/hooks";

export default function FollowingPage() {
  const params = useParams<{ username: string }>();
  const username = decodeURIComponent(params.username);
  const token = useAppSelector((state) => state.auth.token);

  const { error, isPending, refetch, isFetching, hasNextPage, isFetchingNextPage, fetchNextPage, data: pages } =
    useInfiniteQuery({
      queryKey: ["following", username],
      queryFn: ({ pageParam }) =>
        getFollowingPage(username, pageParam, PAGE_SIZE, token).then((r) => pageResult(pageParam, r, PAGE_SIZE)),
      initialPageParam: 1,
      getNextPageParam: (last) => (last.hasNext ? last.page + 1 : undefined),
    });
  const data = pages?.pages.flatMap((p) => p.items);

  return (
    <section className="flex flex-col gap-4 p-6">
      <Link href={`/profile/${username}`} className="text-sm text-neutral-400">
        ← @{username}
      </Link>
      <h1 className="text-base font-semibold">Mengikuti</h1>

      {error && <ErrorMessage message={error.message} onRetry={() => refetch()} retrying={isFetching} />}
      {isPending && <LoadingMessage />}
      {data && (
        <>
          <UserList users={data} emptyText="Belum mengikuti siapa pun." />
          <LoadMoreButton hasNext={Boolean(hasNextPage)} loading={isFetchingNextPage} onClick={() => fetchNextPage()} />
        </>
      )}
    </section>
  );
}
