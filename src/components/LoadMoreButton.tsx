"use client";

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
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="mt-4 h-10 w-full rounded-full border border-neutral-700 text-sm disabled:opacity-60"
    >
      {loading ? "Memuat…" : "Muat lebih banyak"}
    </button>
  );
}
