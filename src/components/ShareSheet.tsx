"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Avatar from "@/components/Avatar";
import { apiFetch } from "@/lib/api";
import { showToast } from "@/lib/toast";
import { toUserSummaries, type UserSummary } from "@/features/users/api";

type Props = {
  /** Post yang dikirim tautannya. Isi salah satu: postId atau path. */
  postId?: string | number;
  /** Path lain yang disalin, misalnya /profile/username. */
  path?: string;
  token: string;
  onClose: () => void;
};

/**
 * Dialog "Share" (gaya Instagram): pilih beberapa akun yang saya ikuti, lalu Send.
 * CATATAN: backend belum punya endpoint pesan langsung. Send saat ini hanya menyalin
 * tautan post dan memberi tahu bahwa pengiriman ke akun lain belum tersedia.
 */
export default function ShareSheet({ postId, path, token, onClose }: Props) {
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  const following = useQuery({
    queryKey: ["my-following-list", token],
    queryFn: () =>
      apiFetch<unknown>("/api/me/following", { token }).then((res) =>
        toUserSummaries(res),
      ),
  });

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function toggle(username: string) {
    setSelected((prev) =>
      prev.includes(username) ? prev.filter((name) => name !== username) : [...prev, username],
    );
  }

  function send() {
    const url = `${window.location.origin}${path ?? `/posts/${postId}`}`;
    navigator.clipboard
      .writeText(url)
      .then(() =>
        showToast(
          `Tautan disalin untuk ${selected.length} akun. Pesan langsung belum tersedia di server.`,
        ),
      )
      .catch(() => showToast("Gagal menyalin tautan", "error"));
    onClose();
  }

  const q = filter.trim().toLowerCase();
  const list: UserSummary[] = (following.data ?? []).filter(
    (u) => !q || u.username.toLowerCase().includes(q) || u.name.toLowerCase().includes(q),
  );

  return (
    <div
      className="fixed inset-0 z-20 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Bagikan"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[80vh] w-full max-w-[393px] flex-col overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-950"
      >
        <div className="relative flex h-12 items-center justify-center border-b border-neutral-800">
          <h2 className="text-base font-semibold">Bagikan</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="absolute right-3 flex h-7 w-7 items-center justify-center rounded-full text-neutral-300 hover:bg-neutral-900"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <label className="flex items-center gap-3 border-b border-neutral-800 px-4 py-3">
          <span className="text-sm font-semibold">Kepada:</span>
          <input
            type="search"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Cari..."
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-neutral-500"
          />
        </label>

        <div className="flex-1 overflow-y-auto">
          {following.isPending && <p className="px-4 py-3 text-sm text-neutral-400">Memuat…</p>}
          {following.error && (
            <p role="alert" className="m-4 rounded-xl bg-red-950 px-3 py-2 text-sm text-red-300">
              {following.error.message}
            </p>
          )}
          {following.data && list.length === 0 && (
            <p className="px-4 py-3 text-sm text-neutral-400">Belum ada akun yang kamu ikuti.</p>
          )}

          <ul className="flex flex-col">
            {list.map((user) => {
              const checked = selected.includes(user.username);
              return (
                <li key={user.id}>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={checked}
                    onClick={() => toggle(user.username)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-neutral-900"
                  >
                    <Avatar username={user.username} avatarUrl={user.avatarUrl} className="h-12 w-12 text-sm font-semibold" />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-sm font-medium">{user.name}</span>
                      <span className="truncate text-xs text-neutral-400">{user.username}</span>
                    </span>
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                        checked ? "border-brand bg-brand" : "border-neutral-600"
                      }`}
                    >
                      {checked && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="border-t border-neutral-800 p-4">
          <button
            type="button"
            onClick={send}
            disabled={selected.length === 0}
            className="h-11 w-full rounded-full bg-brand text-sm font-medium disabled:opacity-50"
          >
            Kirim
          </button>
        </div>
      </div>
    </div>
  );
}
