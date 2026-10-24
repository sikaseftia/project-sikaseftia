"use client";

import { useEffect, useState } from "react";
import { TOAST_EVENT, type ToastTone } from "@/lib/toast";

type Toast = { id: number; message: string; tone: ToastTone };

/** Menampilkan satu notifikasi di atas layar, lalu hilang sendiri setelah beberapa detik. */
export default function Toaster() {
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    function onToast(event: Event) {
      const detail = (event as CustomEvent<{ message: string; tone: ToastTone }>).detail;
      setToast({ id: Date.now(), message: detail.message, tone: detail.tone });
    }
    window.addEventListener(TOAST_EVENT, onToast);
    return () => window.removeEventListener(TOAST_EVENT, onToast);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  if (!toast) return null;

  const color = toast.tone === "success" ? "bg-green-600" : "bg-red-600";

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4" role="status" aria-live="polite">
      <div
        key={toast.id}
        className={`flex max-w-[393px] items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium text-white shadow-lg ${color}`}
      >
        {toast.tone === "success" && (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        )}
        {toast.message}
      </div>
    </div>
  );
}
