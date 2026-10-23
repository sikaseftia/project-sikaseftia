"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import LikedByModal from "@/components/LikedByModal";
import { getPostAuthor, getPostImage } from "@/features/posts/api";
import { isLikedByMe, type LikeablePost } from "@/features/likes/api";
import { useToggleLike } from "@/features/likes/useToggleLike";

type Props = {
  post: LikeablePost;
  token: string | null;
};

export default function PostCard({ post, token }: Props) {
  const [showLikers, setShowLikers] = useState(false);
  const toggle = useToggleLike(token ?? "");
  const liked = isLikedByMe(post);
  const likesCount = post.likesCount ?? 0;
  const postId = String(post.id);
  const author = getPostAuthor(post);
  const src = getPostImage(post);
  const closeLikers = useCallback(() => setShowLikers(false), []);

  return (
    <article className="flex flex-col gap-3 border-b border-neutral-900 pb-4">
      {author && (
        <Link href={`/users/${author.username}`} className="flex items-center gap-3 px-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-800 text-sm font-medium">
            {author.username.charAt(0).toUpperCase()}
          </span>
          <span className="text-sm font-medium">@{author.username}</span>
        </Link>
      )}

      <Link href={`/posts/${postId}`} className="block aspect-square w-full bg-neutral-900">
        {src && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={post.caption ?? "Post"} className="h-full w-full object-cover" />
        )}
      </Link>

      <div className="flex items-center gap-4 px-4 text-sm">
        <button
          type="button"
          aria-pressed={liked}
          aria-label={liked ? "Batal suka" : "Suka"}
          disabled={!token || toggle.isPending}
          onClick={() => toggle.mutate({ postId, liked })}
          className={`text-lg leading-none ${liked ? "text-red-500" : "text-neutral-300"} disabled:opacity-50`}
        >
          {liked ? "♥" : "♡"}
        </button>
        <button
          type="button"
          onClick={() => setShowLikers(true)}
          className="text-neutral-300 hover:underline"
        >
          {likesCount} suka
        </button>
      </div>

      {post.caption && (
        <p className="px-4 text-sm">
          {author && <span className="mr-1 font-medium">@{author.username}</span>}
          {post.caption}
        </p>
      )}

      {toggle.error && (
        <p role="alert" className="mx-4 rounded-lg bg-red-950 px-3 py-2 text-xs text-red-300">
          Gagal memperbarui like: {toggle.error.message}
        </p>
      )}

      {showLikers && <LikedByModal postId={postId} token={token} onClose={closeLikers} />}
    </article>
  );
}
