/**
 * Mengambil tujuan setelah login dari ?returnTo=...
 * Hanya menerima path internal (diawali "/", bukan "//") untuk mencegah open redirect
 * (pengalihan ke situs luar yang dimanipulasi).
 */
export function getReturnTo(fallback = "/feed"): string {
  if (typeof window === "undefined") return fallback;
  const value = new URLSearchParams(window.location.search).get("returnTo");
  if (value && value.startsWith("/") && !value.startsWith("//")) {
    return value;
  }
  return fallback;
}
