"use client";

import { Button } from "@/components/ui/button";

/** Tombol "Muat lebih banyak" untuk daftar berhalaman (useInfiniteQuery). */
export default function LoadMoreButton({
  hasNext,
  loading,
  onClick,
}: {
  hasNext: boolean;
  loading: boolean;
  onClick: () => void;
}) {
  if (!hasNext) return null;
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      disabled={loading}
      className="mt-4 h-10 w-full rounded-full border-neutral-700 bg-transparent text-sm text-white hover:bg-neutral-900"
    >
      {loading ? "Memuat…" : "Muat lebih banyak"}
    </Button>
  );
}
