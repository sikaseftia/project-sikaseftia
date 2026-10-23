"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppSelector } from "@/store/hooks";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { token, hydrated } = useAppSelector((state) => state.auth);
  const isLoggedIn = hydrated && Boolean(token);

  // Halaman autentikasi tampil tanpa header dan navigasi.
  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register");

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      {!isAuthPage && (
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-neutral-900 bg-black/90 px-4 backdrop-blur">
          <Link href="/feed" className="text-base font-semibold">
            Sociality
          </Link>
          {isLoggedIn ? (
            <Link href="/me" className="text-sm text-neutral-300 hover:text-white">
              Profil
            </Link>
          ) : (
            <div className="flex gap-2">
              <Link href="/login" className="rounded-full border border-neutral-700 px-3 py-1.5 text-sm">
                Login
              </Link>
              <Link href="/register" className="rounded-full bg-violet-600 px-3 py-1.5 text-sm">
                Register
              </Link>
            </div>
          )}
        </header>
      )}

      <main className={`flex-1 ${isLoggedIn && !isAuthPage ? "pb-20" : ""}`}>{children}</main>

      {isLoggedIn && !isAuthPage && (
        <nav className="fixed inset-x-0 bottom-0 z-10 flex h-16 items-center justify-around border-t border-neutral-900 bg-black/95">
          <Link href="/feed" className="text-sm text-neutral-300">
            Home
          </Link>
          <Link
            href="/posts/new"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-600 text-xl"
            aria-label="Buat post"
          >
            +
          </Link>
          <Link href="/me" className="text-sm text-neutral-300">
            Profile
          </Link>
        </nav>
      )}
    </div>
  );
}
