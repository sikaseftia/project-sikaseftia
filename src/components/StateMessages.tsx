"use client";

/** Pesan loading yang seragam. */
export function LoadingMessage({ text = "Memuat…" }: { text?: string }) {
  return (
    <p role="status" className="py-6 text-center text-sm text-neutral-400">
      {text}
    </p>
  );
}

/** Pesan error yang seragam, dengan tombol Coba lagi (retry). */
export function ErrorMessage({
  message,
  onRetry,
  retrying = false,
}: {
  message: string;
  onRetry?: () => void;
  retrying?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <p role="alert" className="rounded-lg bg-red-950 px-3 py-2 text-sm text-red-300">
        {message}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          disabled={retrying}
          className="h-10 rounded-full border border-neutral-700 text-sm disabled:opacity-60"
        >
          {retrying ? "Mencoba lagi…" : "Coba lagi"}
        </button>
      )}
    </div>
  );
}

/** Pesan kosong yang seragam: judul, dan keterangan opsional. */
export function EmptyMessage({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center gap-1 py-10 text-center">
      <p className="text-sm font-semibold">{title}</p>
      {description && <p className="text-xs text-neutral-500">{description}</p>}
    </div>
  );
}
