import { redirect } from "next/navigation";

/** Rute lama /search dialihkan ke /users/search (sesuai PDF). */
export default async function SearchRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  redirect(q ? `/users/search?q=${encodeURIComponent(q)}` : "/users/search");
}
