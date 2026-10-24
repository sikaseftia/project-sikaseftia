"use client";

import { useState } from "react";
import Link from "next/link";
import { getPostImage, type Post } from "@/features/posts/api";

type Props = { posts: Post[] };

/** Grid thumbnail post: 3 kolom di HP, 4 kolom di tablet dan desktop. */
export default function PostGrid({ posts }: Props) {
  return (
    <div className="grid grid-cols-3 gap-1 ">
      {posts.map((post) => (
        <PostThumb key={String(post.id)} post={post} />
      ))}
    </div>
  );
}

/** Satu thumbnail. Jika gambar gagal dimuat, tampilkan placeholder (bukan kotak kosong). */
function PostThumb({ post }: { post: Post }) {
  const [failed, setFailed] = useState(false);
  const src = getPostImage(post);

  return (
    <Link
      href={`/posts/${post.id}`}
      className="flex aspect-square items-center justify-center overflow-hidden bg-neutral-900 text-center text-xs text-neutral-500 focus-visible:outline-2 focus-visible:outline-brand-soft"
    >
      {src && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={post.caption || "Postingan"}
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="px-2">Gambar tidak tersedia</span>
      )}
    </Link>
  );
}
