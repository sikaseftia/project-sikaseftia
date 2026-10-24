"use client";

import { ErrorMessage, EmptyMessage, LoadingMessage } from "@/components/StateMessages";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import UserList from "@/components/UserList";
import { getPostLikers } from "@/features/likes/api";

type Props = {
  postId: string;
  token: string | null;
  onClose: () => void;
};

/** Daftar pengguna yang menyukai sebuah post. Terbuka sebagai dialog. */
export default function LikedByModal({ postId, token, onClose }: Props) {
  const { data, error, isPending, refetch, isFetching } = useQuery({
    queryKey: ["post-likers", postId],
    queryFn: () => getPostLikers(postId, token),
  });

  // Tutup dengan tombol Escape.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-20 flex items-end justify-center bg-black/70 sm:items-center"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Suka"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[70vh] w-full max-w-[393px] flex-col rounded-t-2xl border border-neutral-800 bg-neutral-950 px-4 pb-5 pt-4 sm:rounded-2xl"
      >
        {/* Figma: judul "Likes" di kiri dan tombol X di kanan. */}
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">Suka</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="flex h-7 w-7 items-center justify-center rounded-full text-neutral-300 hover:bg-neutral-900"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto">
          {isPending && <LoadingMessage />}
          {error && <ErrorMessage message={error.message} onRetry={() => refetch()} retrying={isFetching} />}
          {data && <UserList users={data} token={token} emptyText="Belum ada yang menyukai post ini." />}
        </div>
      </div>
    </div>
  );
}
