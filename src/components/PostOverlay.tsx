"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import PostDetail from "@/components/PostDetail";

export default function PostOverlay({ id }: { id: string }) {
  const router = useRouter();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") router.back();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  return (
    <div
      className="fixed inset-0 z-30 flex items-end justify-center bg-black/80 md:items-center"
      onClick={() => router.back()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Detail post"
        onClick={(e) => e.stopPropagation()}
        className="relative flex max-h-[92dvh] w-full max-w-[393px] flex-col overflow-y-auto rounded-t-3xl bg-neutral-950 md:h-[85vh] md:max-w-[960px] md:overflow-hidden md:rounded-3xl"
      >
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Tutup"
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
        <PostDetail id={id} embedded />
      </div>
    </div>
  );
}
