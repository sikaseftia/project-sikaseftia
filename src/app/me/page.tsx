"use client";

import { Suspense, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import AuthGuard from "@/components/AuthGuard";
import PostGrid from "@/components/PostGrid";
import ShareSheet from "@/components/ShareSheet";
import LoadMoreButton from "@/components/LoadMoreButton";
import { getMe } from "@/features/auth/api";
import { getMyPostsPage, type Post } from "@/features/posts/api";
import { getMyLikesPage } from "@/features/likes/api";
import { getSavedPostsPage } from "@/features/saves/api";
import { PAGE_SIZE, pageResult } from "@/lib/paging";
import { ApiError } from "@/lib/api";
import { clearSession, writeStoredToken } from "@/store/authSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

/** Tab sesuai PDF: Postingan, Disimpan, Disukai. Overview = bagian header di atas tab. Pengaturan ada di Edit Profil. */
const TABS = [
  { key: "posts", label: "Postingan" },
  { key: "saved", label: "Disimpan" },
  { key: "likes", label: "Disukai" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function isTabKey(value: string | null): value is TabKey {
  return TABS.some((item) => item.key === value);
}

function Stat({ value, label }: { value: number | string; label: string }) {
  return (
    <span className="flex flex-col items-center gap-0.5">
      <span className="text-sm font-semibold ">{value}</span>
      <span className="text-xs text-neutral-500">{label}</span>
    </span>
  );
}

function RetryError({ message, onRetry, retrying }: { message: string; onRetry: () => void; retrying: boolean }) {
  return (
    <div className="flex flex-col gap-2">
      <p role="alert" className="rounded-lg bg-red-950 px-3 py-2 text-sm text-red-300">
        {message}
      </p>
      <button
        type="button"
        onClick={onRetry}
        disabled={retrying}
        className="h-10 rounded-full border border-neutral-700 text-sm disabled:opacity-60"
      >
        Coba lagi
      </button>
    </div>
  );
}

function PostList({
  loading,
  error,
  posts,
  emptyText,
  onRetry,
  retrying,
  hasNext,
  loadingMore,
  onLoadMore,
}: {
  loading: boolean;
  error: Error | null;
  posts: Post[] | undefined;
  emptyText: string;
  onRetry: () => void;
  retrying: boolean;
  hasNext: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
}) {
  if (loading) return <p className="text-sm text-neutral-400">Memuat post…</p>;
  if (error) return <RetryError message={error.message} onRetry={onRetry} retrying={retrying} />;
  if (!posts || posts.length === 0) {
    return <p className="py-10 text-center text-sm text-neutral-400">{emptyText}</p>;
  }
  return (
    <>
      <PostGrid posts={posts} />
      <LoadMoreButton hasNext={hasNext} loading={loadingMore} onClick={onLoadMore} />
    </>
  );
}

function TabIcon({ name }: { name: TabKey }) {
  const size = 16;
  if (name === "posts") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    );
  }
  if (name === "saved") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z" />
    </svg>
  );
}

function MeContent() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const params = useSearchParams();
  const token = useAppSelector((state) => state.auth.token);
  const tabParam = params.get("tab");
  const tab: TabKey = isTabKey(tabParam) ? tabParam : "posts";

  const me = useQuery({
    queryKey: ["me"],
    queryFn: () => getMe(token as string),
    enabled: Boolean(token),
  });

  const myPosts = useInfiniteQuery({
    queryKey: ["my-posts"],
    queryFn: ({ pageParam }) =>
      getMyPostsPage(token as string, pageParam, PAGE_SIZE).then((r) => pageResult(pageParam, r, PAGE_SIZE)),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.hasNext ? last.page + 1 : undefined),
    enabled: Boolean(token),
  });

  const saved = useInfiniteQuery({
    queryKey: ["saved"],
    queryFn: ({ pageParam }) =>
      getSavedPostsPage(token as string, pageParam, PAGE_SIZE).then((r) => pageResult(pageParam, r, PAGE_SIZE)),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.hasNext ? last.page + 1 : undefined),
    enabled: Boolean(token) && tab === "saved",
  });

  const likes = useInfiniteQuery({
    queryKey: ["my-likes"],
    queryFn: ({ pageParam }) =>
      getMyLikesPage(token as string, pageParam, PAGE_SIZE).then((r) => pageResult(pageParam, r, PAGE_SIZE)),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.hasNext ? last.page + 1 : undefined),
    enabled: Boolean(token) && tab === "likes",
  });

  const myPostItems = myPosts.data?.pages.flatMap((p) => p.items);
  const savedItems = saved.data?.pages.flatMap((p) => p.items);
  const likedItems = likes.data?.pages.flatMap((p) => p.items);

  // Token kedaluwarsa atau tidak valid: paksa logout supaya pengguna login ulang.
  useEffect(() => {
    if (me.error instanceof ApiError && me.error.status === 401) {
      writeStoredToken(null);
      dispatch(clearSession());
      queryClient.clear();
      router.replace("/login");
    }
  }, [me.error, dispatch, queryClient, router]);

  const data = me.data;
  const error = me.error;
  const extra = data as Record<string, unknown> | undefined;
  const initial = data?.name?.charAt(0).toUpperCase() ?? "?";

  // Statistik ditampilkan dua kali: grid 4 kolom di HP, baris lebar di desktop.
  function statsRow(className: string) {
    return (
      <div className={`grid grid-cols-4 py-1 text-center ${className}`}>
        <Stat value={(extra?.postsCount as number | undefined) ?? "–"} label="Postingan" />
        <Link href="/me/followers">
          <Stat value={(extra?.followersCount as number | undefined) ?? "–"} label="Pengikut" />
        </Link>
        <Link href="/me/following">
          <Stat value={(extra?.followingCount as number | undefined) ?? "–"} label="Mengikuti" />
        </Link>
        <Link href="/me?tab=likes" scroll={false}>
          <Stat value={(extra?.likesCount as number | undefined) ?? "–"} label="Suka" />
        </Link>
      </div>
    );
  }

  let body: ReactNode = null;
  if (tab === "posts") {
    body = (
      <>
        {myPosts.error && (
          <RetryError
            message={`Post gagal dimuat: ${myPosts.error.message}`}
            onRetry={() => myPosts.refetch()}
            retrying={myPosts.isFetching}
          />
        )}
        {myPosts.isPending && <p className="text-sm text-neutral-400">Memuat post…</p>}
        {myPostItems && myPostItems.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <h2 className="text-base font-semibold">Ceritamu dimulai di sini</h2>
            <p className="max-w-[280px] text-xs leading-relaxed text-neutral-400">
              Bagikan post pertamamu dan biarkan dunia melihat momen, passion, dan kenangan kamu. Jadikan ruang ini benar-benar milikmu.
            </p>
            <Link href="/create" className="mt-3 flex h-10 items-center rounded-full bg-brand px-5 text-sm font-medium">
              Unggah Post Pertama
            </Link>
          </div>
        )}
        {myPostItems && myPostItems.length > 0 && (
          <>
            <PostGrid posts={myPostItems} />
            <LoadMoreButton
              hasNext={Boolean(myPosts.hasNextPage)}
              loading={myPosts.isFetchingNextPage}
              onClick={() => myPosts.fetchNextPage()}
            />
          </>
        )}
      </>
    );
  } else if (tab === "saved") {
    body = (
      <PostList
        loading={saved.isPending}
        error={saved.error}
        posts={savedItems}
        emptyText="Belum ada post yang disimpan."
        onRetry={() => saved.refetch()}
        retrying={saved.isFetching}
        hasNext={Boolean(saved.hasNextPage)}
        loadingMore={saved.isFetchingNextPage}
        onLoadMore={() => saved.fetchNextPage()}
      />
    );
  } else if (tab === "likes") {
    body = (
      <PostList
        loading={likes.isPending}
        error={likes.error}
        posts={likedItems}
        emptyText="Kamu belum menyukai post apa pun."
        onRetry={() => likes.refetch()}
        retrying={likes.isFetching}
        hasNext={Boolean(likes.hasNextPage)}
        loadingMore={likes.isFetchingNextPage}
        onLoadMore={() => likes.fetchNextPage()}
      />
    );
  }

  return (
    <section className="flex flex-col gap-5 px-4 py-5 ">
      {error && !(error instanceof ApiError && error.status === 401) && (
        <p role="alert" className="rounded-lg bg-red-950 px-3 py-2 text-sm text-red-300">
          Profil gagal dimuat: {error.message}
        </p>
      )}

      {!data && !error && <p className="text-sm text-neutral-400">Memuat profil…</p>}

      {data && (
        <>
          {/* Overview: avatar, nama, tombol, dan statistik. Di desktop avatar tampil besar di kiri. */}
          <div className="flex items-center gap-4 ">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-800 text-lg font-semibold ">
              {data.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={data.avatarUrl as string} alt={data.name} className="h-full w-full object-cover" />
              ) : (
                initial
              )}
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-3 ">
              <div className="flex min-w-0 flex-col">
                <h1 className="truncate text-sm font-semibold ">{data.name}</h1>
                <p className="truncate text-xs text-neutral-400 ">@{data.username}</p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href="/me/edit"
                  className="flex h-9 flex-1 items-center justify-center rounded-full border border-neutral-700 text-sm font-medium "
                >
                  Edit Profil
                </Link>
                <ShareButton username={data.username} />
              </div>
                </div>
          </div>

          {data.bio && <p className="text-sm leading-relaxed text-neutral-200">{data.bio}</p>}

          {statsRow("")}
        </>
      )}

      <nav aria-label="Tab profil" className="flex border-b border-neutral-900 text-sm">
        {TABS.map((item) => {
          const active = tab === item.key;
          return (
            <Link
              key={item.key}
              href={`/me?tab=${item.key}`}
              scroll={false}
              aria-current={active ? "page" : undefined}
              aria-label={item.label}
              className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 ${
                active ? "border-b-2 border-brand font-medium" : "text-neutral-500 hover:text-neutral-200"
              }`}
            >
              <TabIcon name={item.key} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {body}
    </section>
  );
}

/** Tombol bagikan (ikon kertas pesawat): membuka lembar Kirim untuk mengirim tautan profil. */
function ShareButton({ username }: { username: string }) {
  const token = useAppSelector((state) => state.auth.token);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        aria-label="Bagikan profil"
        onClick={() => (token ? setOpen(true) : router.push("/login?returnTo=/me"))}
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

export default function MePage() {
  return (
    <AuthGuard>
      <Suspense fallback={<p className="p-6 text-sm text-neutral-400">Memuat…</p>}>
        <MeContent />
      </Suspense>
    </AuthGuard>
  );
}
