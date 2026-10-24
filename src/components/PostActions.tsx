"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import LikedByModal from "@/components/LikedByModal";
import { Button } from "@/components/ui/button";
import ShareSheet from "@/components/ShareSheet";
import { isLikedByMe, type LikeablePost } from "@/features/likes/api";
import { useToggleLike } from "@/features/likes/useToggleLike";
import { savePost, unsavePost } from "@/features/saves/api";
import { track } from "@/lib/analytics";

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg className="size-[22px]" width="22" height="22" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z" />
    </svg>
  );
}

function PaperPlaneIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 2 11 13" />
      <path d="M22 2l-7 20-4-9-9-4 20-7z" />
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
    <svg className="size-[22px]" width="22" height="22" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}

type Props = {
  post: LikeablePost;
  token: string | null;
  /** Jika diisi, ikon komentar membuka halaman post (dipakai di feed). Jika kosong, ikon memfokuskan kolom komentar. */
  commentHref?: string;
};

/** Baris aksi post: suka, jumlah suka, komentar, kirim, dan simpan. Dipakai di feed dan di detail post. */
export default function PostActions({ post, token, commentHref }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const [showLikers, setShowLikers] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [optimisticSaved, setOptimisticSaved] = useState<boolean | null>(null);
  const toggle = useToggleLike(token ?? "");
  const liked = isLikedByMe(post);
  const likesCount = post.likesCount ?? 0;
  const commentsCount = post.commentsCount ?? 0;
  const postId = String(post.id);
  const closeLikers = useCallback(() => setShowLikers(false), []);
  const loginHref = `/login?returnTo=${encodeURIComponent(pathname)}`;

  // Status simpan dibaca dari post itu sendiri. Daftar Saved sudah dipaginasi, jadi
  // tidak bisa dipakai untuk mencocokkan post di halaman mana pun.
  const serverSaved = Boolean(post.isSaved);
  // Tampilan langsung: pakai status optimistic bila ada, jika tidak pakai status dari server.
  const saved = optimisticSaved ?? serverSaved;

  const toggleSave = useMutation({
    mutationFn: (next: boolean) => (next ? savePost(postId, token ?? "") : unsavePost(postId, token ?? "")),
    onMutate: (next) => {
      setOptimisticSaved(next);
    },
    onError: () => {
      // Kembalikan ke status server (rollback).
      setOptimisticSaved(null);
    },
    onSuccess: (_data, next) => track(next ? "save" : "unsave", { postId }),
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ["saved"] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
      setOptimisticSaved(null);
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
    toggleSave.mutate(!saved);
  }

  function onShare() {
    if (!token) return router.push(loginHref);
    setShowShare(true);
  }

  function focusComment() {
    const input = document.querySelector<HTMLElement>('[aria-label="Tulis komentar"]');
    input?.scrollIntoView({ behavior: "smooth", block: "center" });
    input?.focus();
  }

  const commentClass = "flex items-center gap-1.5 text-sm text-neutral-100";
  const commentContent = (
    <>
      <CommentIcon />
      <span className="text-neutral-300">{commentsCount}</span>
    </>
  );

  return (
    <>
      <div className="flex items-center gap-4 px-4">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-pressed={liked}
          aria-label={liked ? "Batal suka" : "Suka"}
          disabled={toggle.isPending}
          onClick={onLike}
          className={`h-auto w-auto rounded-none p-0 hover:bg-transparent hover:text-current disabled:opacity-50 ${liked ? "text-red-500" : "text-neutral-100"}`}
        >
          <HeartIcon filled={liked} />
        </Button>
        <button
          type="button"
          onClick={() => setShowLikers(true)}
          className="text-sm text-neutral-300 hover:underline"
          aria-label={`${likesCount} suka, lihat daftar`}
        >
          {likesCount}
        </button>
        {commentHref ? (
          <Link href={commentHref} className={commentClass} aria-label="Komentar">
            {commentContent}
          </Link>
        ) : (
          <button type="button" onClick={focusComment} className={commentClass} aria-label="Komentar">
            {commentContent}
          </button>
        )}
        <button
          type="button"
          aria-label="Bagikan post"
          onClick={onShare}
          className="flex items-center text-neutral-100"
        >
          <PaperPlaneIcon />
        </button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-pressed={saved}
          aria-label={saved ? "Hapus dari simpanan" : "Simpan"}
          disabled={toggleSave.isPending}
          onClick={onSave}
          className={`ml-auto h-auto w-auto rounded-none p-0 hover:bg-transparent hover:text-current disabled:opacity-50 ${saved ? "text-brand-soft" : "text-neutral-100"}`}
        >
          <BookmarkIcon filled={saved} />
        </Button>
      </div>

      {(toggle.error || toggleSave.error) && (
        <p role="alert" className="mx-4 rounded-lg bg-red-950 px-3 py-2 text-xs text-red-300">
          Gagal memperbarui: {(toggle.error ?? toggleSave.error)?.message}
        </p>
      )}

      {showShare && token && (
        <ShareSheet postId={postId} token={token} onClose={() => setShowShare(false)} />
      )}
      {showLikers && <LikedByModal postId={postId} token={token} onClose={closeLikers} />}
    </>
  );
}
