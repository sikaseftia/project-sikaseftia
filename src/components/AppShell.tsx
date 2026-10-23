"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getMe } from "@/features/auth/api";
import { useAppSelector } from "@/store/hooks";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [searchText, setSearchText] = useState("");
  const { token, hydrated } = useAppSelector((state) => state.auth);
  const isLoggedIn = hydrated && Boolean(token);

  // Nama dan foto profil untuk header. Memakai query ["me"] yang sama dengan halaman lain (cache bersama).
  const me = useQuery({
    queryKey: ["me"],
    queryFn: () => getMe(token as string),
    enabled: isLoggedIn,
  });
  const displayName = me.data?.name ?? me.data?.username ?? "";
  const initial = displayName.charAt(0).toUpperCase();
  const avatarUrl = me.data?.avatarUrl as string | null | undefined;

  // Halaman autentikasi tampil tanpa header dan navigasi.
  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register");

  // Lebar kolom mengikuti frame Figma (393px). Halaman auth memakai gradien hitam ke ungu berbentuk kurva (cahaya naik dari bawah, membentuk huruf C).
  // Di desktop, kolom ini tampil sebagai frame mobile di tengah layar (seperti canvas Figma).
  const frame = "mx-auto w-full max-w-[393px] md:border-x md:border-neutral-900";

  return (
    <div
      className={`flex min-h-screen flex-col bg-black text-white md:bg-neutral-950 ${
        isAuthPage ? "bg-[radial-gradient(ellipse_95%_42%_at_50%_34%,#000_72%,transparent_100%),radial-gradient(ellipse_120%_80%_at_50%_100%,#6143e8_0%,#000_75%)]" : ""
      }`}
    >
      {!isAuthPage && (
        <header
          className="sticky top-0 z-10 flex h-14 w-full items-center gap-2 border-b border-neutral-900 bg-black/90 px-4 backdrop-blur"
          aria-label="Header utama"
        >
          {/* Kiri: logo dan nama app (Figma: logo + "Sociality"). */}
          <Link href="/feed" className="flex shrink-0 items-center gap-1.5 text-sm font-semibold">
            <Image src="/logo.png" alt="" width={24} height={24} priority />
            Sociality
          </Link>

          {isLoggedIn ? (
            <>
              {/* Tengah: satu-satunya kolom pencarian. Enter membuka /search?q=... */}
              <form
                role="search"
                className="min-w-0 flex-1 md:mx-auto md:w-80 md:flex-none"
                onSubmit={(e) => {
                  e.preventDefault();
                  const q = searchText.trim();
                  router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
                }}
              >
                <label className="flex h-8 items-center gap-2 rounded-full border border-neutral-800 bg-surface px-3 text-xs text-neutral-500 focus-within:border-brand">
                  <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-3.5-3.5" />
                  </svg>
                  <input
                    type="search"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="Search"
                    aria-label="Cari pengguna"
                    className="min-w-0 flex-1 bg-transparent text-white outline-none placeholder:text-neutral-500"
                  />
                </label>
              </form>

              {/* Kanan: foto dan nama profil (Figma: avatar + nama). */}
              <Link href="/me" className="flex shrink-0 items-center gap-1.5 text-xs text-neutral-200 hover:text-white">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="" className="h-6 w-6 rounded-full object-cover" />
                ) : (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-800 text-[10px] font-medium">
                    {initial || "?"}
                  </span>
                )}
                <span className="max-w-[72px] truncate">{displayName || "Profil"}</span>
              </Link>
            </>
          ) : (
            <div className="ml-auto flex gap-2 text-xs">
              <Link href="/login" className="rounded-full border border-neutral-700 px-3 py-1.5">
                Login
              </Link>
              <Link href="/register" className="rounded-full bg-brand px-3 py-1.5">
                Register
              </Link>
            </div>
          )}
        </header>
      )}

      <main className={`${frame} flex-1 ${isLoggedIn && !isAuthPage ? "pb-28" : ""}`}>{children}</main>

      {isLoggedIn && !isAuthPage && (
        <nav aria-label="Navigasi utama" className="pointer-events-none fixed inset-x-0 bottom-4 z-10 mx-auto w-full max-w-[393px] px-6">
          {/* Figma: bar melayang berbentuk pill, tombol + di tengah berwarna brand. */}
          <div className="pointer-events-auto flex items-center justify-between rounded-full border border-neutral-800 bg-neutral-950/95 px-7 py-2 shadow-lg shadow-black/60 backdrop-blur">
            <NavLink href="/feed" label="Home" active={pathname === "/feed"}>
              <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
            </NavLink>
            <Link
              href="/posts/new"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-brand text-2xl leading-none text-white"
              aria-label="Buat post"
            >
              +
            </Link>
            <NavLink href="/me" label="Profile" active={pathname.startsWith("/me")}>
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21a8 8 0 0 1 16 0" />
            </NavLink>
          </div>
        </nav>
      )}
    </div>
  );
}

function NavLink({
  href,
  label,
  active,
  children,
}: {
  href: string;
  label: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex flex-col items-center gap-0.5 text-[10px] ${active ? "text-white" : "text-neutral-500"}`}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {children}
      </svg>
      {label}
    </Link>
  );
}
