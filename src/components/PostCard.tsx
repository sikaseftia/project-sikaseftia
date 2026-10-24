"use client";

import Avatar from "@/components/Avatar";
import { useState } from "react";
import Link from "next/link";
import dayjs from "dayjs";
import { timeAgo } from "@/lib/time";
import PostActions from "@/components/PostActions";
import { getPostAuthor, getPostImage } from "@/features/posts/api";
import type { LikeablePost } from "@/features/likes/api";

type Props = {
  post: LikeablePost;
  token: string | null;
};

export default function PostCard({ post, token }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const postId = String(post.id);
  const author = getPostAuthor(post);
  const src = getPostImage(post);
  const createdAt = (post as { createdAt?: string }).createdAt;
  const commentsCount = post.commentsCount ?? 0;
  const caption = post.caption ?? "";
  const longCaption = caption.length > 90;

  return (
    <article className="flex flex-col gap-3 border-b border-neutral-900 pb-4">
      {/* Header: avatar, nama, dan waktu (Figma). */}
      {author && (
        <div className="flex items-center gap-2.5 px-4">
          <Link href={`/profile/${author.username}`} className="flex min-w-0 items-center gap-2.5">
            <Avatar username={author.username} avatarUrl={author.avatarUrl} className="h-8 w-8 text-xs font-semibold" />
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-semibold">{author.username}</span>
              {createdAt && (
                <span className="truncate text-xs text-neutral-500" title={dayjs(createdAt).format("D MMM YYYY, HH:mm")}>{timeAgo(createdAt)}</span>
              )}
            </span>
          </Link>
        </div>
      )}

      <Link
        href={`/posts/${postId}`}
        className="flex aspect-square w-full items-center justify-center bg-neutral-900"
      >
        {src && !imgFailed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={post.caption || `Foto post dari @${author?.username ?? "pengguna"}`}
            onError={() => setImgFailed(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-sm text-neutral-500">Gambar tidak tersedia</span>
        )}
      </Link>

      <PostActions post={post} token={token} commentHref={`/posts/${postId}`} />

      {caption && (
        <div className="px-4 text-sm leading-relaxed">
          {author && <span className="mr-1.5 font-semibold">{author.username}</span>}
          <span className={expanded || !longCaption ? "" : "line-clamp-2"}>{caption}</span>
          {longCaption && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="ml-1 text-xs text-neutral-500"
            >
              {expanded ? "Tutup" : "Lihat selengkapnya"}
            </button>
          )}
        </div>
      )}

      <Link href={`/posts/${postId}`} className="px-4 text-sm text-neutral-500">
        {commentsCount} komentar
      </Link>
    </article>
  );
}
