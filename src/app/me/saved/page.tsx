import { redirect } from "next/navigation";

/** Saved sekarang menjadi tab di /me sesuai PDF. Halaman lama dialihkan. */
export default function SavedRedirectPage() {
  redirect("/me?tab=saved");
}
