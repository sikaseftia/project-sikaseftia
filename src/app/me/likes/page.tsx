import { redirect } from "next/navigation";

/** Likes sekarang menjadi tab di /me. Halaman lama dialihkan. */
export default function LikesRedirectPage() {
  redirect("/me?tab=likes");
}
