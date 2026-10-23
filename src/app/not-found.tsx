import Link from "next/link";

export default function NotFound() {
  return (
    <section className="flex flex-col items-center gap-4 p-10 text-center">
      <h1 className="text-base font-semibold">Halaman tidak ditemukan</h1>
      <p className="text-sm text-neutral-400">Alamat yang kamu buka tidak tersedia.</p>
      <Link href="/feed" className="h-10 rounded-full bg-brand px-6 py-2 text-sm">
        Kembali ke feed
      </Link>
    </section>
  );
}
