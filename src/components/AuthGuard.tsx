"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAppSelector } from "@/store/hooks";

/**
 * Melindungi halaman privat.
 * Jika belum login, pengguna diarahkan ke /login dengan returnTo
 * supaya setelah login kembali ke halaman yang tadi dibuka.
 */
export default function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { token, hydrated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (hydrated && !token) {
      router.replace(`/login?returnTo=${encodeURIComponent(pathname)}`);
    }
  }, [hydrated, token, pathname, router]);

  if (!hydrated || !token) {
    return <p className="p-6 text-sm text-neutral-400">Memuat…</p>;
  }

  return <>{children}</>;
}
