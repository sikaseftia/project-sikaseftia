import { redirect } from "next/navigation";

/** Halaman Buat Post dipindah ke /create. Rute ini dialihkan supaya tidak tertangkap overlay /posts/[id]. */
export default function NewPostRedirectPage() {
  redirect("/create");
}
