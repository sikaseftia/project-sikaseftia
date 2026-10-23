"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import dayjs from "dayjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import LikedByModal from "@/components/LikedByModal";
import { getPostAuthor, getPostImage } from "@/features/posts/api";
import { isLikedByMe, type LikeablePost } from "@/features/likes/api";
import { useToggleLike } from "@/features/likes/useToggleLike";
import { getSavedPosts, savePost, unsavePost } from "@/features/saves/api";
import { track } from "@/lib/analytics";

type Props = {
  post: LikeablePost;
  token: string | null;
};

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z" />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}

export default function PostCard({ post, token }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const [showLikers, setShowLikers] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const toggle = useToggleLike(token ?? "");
  const liked = isLikedByMe(post);
  const likesCount = post.likesCount ?? 0;
  const commentsCount = post.commentsCount ?? 0;
  const postId = String(post.id);
  const author = getPostAuthor(post);
  const src = getPostImage(post);
  const createdAt = (post as { createdAt?: string }).createdAt;
  const closeLikers = useCallback(() => setShowLikers(false), []);
  const loginHref = `/login?returnTo=${encodeURIComponent(pathname)}`;

  // Status simpan diambil dari daftar Saved (sumber yang pasti), bukan dari field di feed
  // yang namanya belum terverifikasi. Field di feed hanya dipakai sebagai cadangan.
  const savedList = useQuery({
    queryKey: ["saved"],
    queryFn: () => getSavedPosts(token as string),
    enabled: Boolean(token),
  });
  const saved = savedList.data
    ? savedList.data.some((item) => String(item.id) === postId)
    : Boolean(post.isSaved);

  const toggleSave = useMutation({
    mutationFn: () => (saved ? unsavePost(postId, token ?? "") : savePost(postId, token ?? "")),
    onSuccess: () => track(saved ? "unsave" : "save", { postId }),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["saved"] });
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
    },
  });

  function onLike() {
    if (!token) return router.push(loginHref);
    toggle.mutate(
      { postId, liked },
      { onSuccess: () => track(liked ? "unlike" : "like", { postId }) },
    );
  }

  function onSave() {
    if (!token) return router.push(loginHref);
    toggleSave.mutate();
  }

  const caption = post.caption ?? "";
  const longCaption = caption.length > 90;

  return (
    <article className="flex flex-col gap-3 border-b border-neutral-900 pb-4">
      {/* Header: avatar, nama, dan waktu (Figma). */}
      {author && (
        <div className="flex items-center gap-2.5 px-4">
          <Link href={`/profile/${author.username}`} className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-800 text-xs font-semibold">
              {author.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={author.avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                author.username.charAt(0).toUpperCase()
              )}
            </span>
            <span className="truncate text-sm font-semibold">{author.username}</span>
          </Link>
          {createdAt && (
            <span className="ml-auto shrink-0 text-xs text-neutral-500">{dayjs(createdAt).format("D MMM")}</span>
          )}
        </div>
      )}

      <Link
        href={`/posts/${postId}`}
        className="flex aspect-square w-full items-center justify-center bg-neutral-900"
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={post.caption || `Foto post dari @${author?.username ?? "pengguna"}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-sm text-neutral-500">Gambar tidak tersedia</span>
        )}
      </Link>

      {/* Baris aksi: suka, komentar, simpan (Figma). */}
      <div className="flex items-center gap-4 px-4">
        <button
          type="button"
          aria-pressed={liked}
          aria-label={liked ? "Batal suka" : "Suka"}
          disabled={toggle.isPending}
          onClick={onLike}
          className={`flex items-center gap-1.5 text-sm disabled:opacity-50 ${liked ? "text-red-500" : "text-neutral-100"}`}
        >
          <HeartIcon filled={liked} />
        </button>
        <button
          type="button"
          onClick={() => setShowLikers(true)}
          className="text-sm text-neutral-300 hover:underline"
          aria-label={`${likesCount} suka, lihat daftar`}
        >
          {likesCount}
        </button>
        <Link href={`/posts/${postId}`} className="flex items-center gap-1.5 text-sm text-neutral-100" aria-label="Komentar">
          <CommentIcon />
          <span className="text-neutral-300">{commentsCount}</span>
        </Link>
        <button
          type="button"
          aria-pressed={saved}
          aria-label={saved ? "Hapus dari simpanan" : "Simpan"}
          disabled={toggleSave.isPending}
          onClick={onSave}
          className={`ml-auto disabled:opacity-50 ${saved ? "text-brand-soft" : "text-neutral-100"}`}
        >
          <BookmarkIcon filled={saved} />
        </button>
      </div>

      {caption && (
        <div className="px-4 text-sm leading-relaxed">
          {author && <span className="mr-1.5 font-semibold">{author.username}</span>}
          <span className={expanded || !longCaption ? "" : "line-clamp-2"}>{caption}</span>
          {longCaption && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="ml-1 text-xs text-neutral-500"
            >
              {expanded ? "Show Less" : "Show More"}
            </button>
          )}
        </div>
      )}

      <Link href={`/posts/${postId}`} className="px-4 text-sm text-neutral-500">
        {commentsCount} komentar
      </Link>

      {(toggle.error || toggleSave.error) && (
        <p role="alert" className="mx-4 rounded-lg bg-red-950 px-3 py-2 text-xs text-red-300">
          Gagal memperbarui: {(toggle.error ?? toggleSave.error)?.message}
        </p>
      )}

      {showLikers && <LikedByModal postId={postId} token={token} onClose={closeLikers} />}
    </article>
  );
}
