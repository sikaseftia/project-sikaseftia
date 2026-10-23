"use client";

import { useEffect } from "react";

/** Penangkap error global untuk halaman di bawah root layout. */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section role="alert" className="flex flex-col items-center gap-4 p-10 text-center">
      <p className="text-base font-medium">Terjadi kesalahan</p>
      <p className="text-sm text-neutral-400">Halaman ini gagal ditampilkan. Coba muat ulang.</p>
      <button
        type="button"
        onClick={() => reset()}
        className="h-10 rounded-full bg-brand px-6 text-sm"
      >
        Coba lagi
      </button>
    </section>
  );
}
