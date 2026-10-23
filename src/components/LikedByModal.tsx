"use client";

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
  const { data, error, isPending } = useQuery({
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
        aria-label="Disukai oleh"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[70vh] w-full max-w-sm flex-col rounded-t-2xl border border-neutral-800 bg-neutral-950 p-4 sm:rounded-2xl"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">Disukai oleh</h2>
          <button type="button" onClick={onClose} className="text-sm text-neutral-400">
            Tutup
          </button>
        </div>

        <div className="overflow-y-auto">
          {isPending && <p className="text-sm text-neutral-400">Memuat…</p>}
          {error && (
            <p role="alert" className="rounded-lg bg-red-950 px-3 py-2 text-sm text-red-300">
              {error.message}
            </p>
          )}
          {data && <UserList users={data} emptyText="Belum ada yang menyukai post ini." />}
        </div>
      </div>
    </div>
  );
}
