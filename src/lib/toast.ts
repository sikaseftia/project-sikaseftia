export type ToastTone = "success" | "error";

export const TOAST_EVENT = "app:toast";

/** Menampilkan notifikasi singkat. Hijau untuk sukses (default), merah untuk gagal. */
export function showToast(message: string, tone: ToastTone = "success") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail: { message, tone } }));
}
