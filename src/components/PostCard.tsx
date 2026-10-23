"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import LikedByModal from "@/components/LikedByModal";
import { getPostAuthor, getPostImage } from "@/features/posts/api";
import { isLikedByMe, type LikeablePost } from "@/features/likes/api";
import { useToggleLike } from "@/features/likes/useToggleLike";
import { getSavedPosts, savePost, unsavePost } from "@/features/saves/api";

type Props = {
  post: LikeablePost;
  token: string | null;
};

export default function PostCard({ post, token }: Props) {
  const queryClient = useQueryClient();
  const [showLikers, setShowLikers] = useState(false);
  const toggle = useToggleLike(token ?? "");
  const liked = isLikedByMe(post);
  const likesCount = post.likesCount ?? 0;
  const postId = String(post.id);
  const author = getPostAuthor(post);
  const src = getPostImage(post);
  const closeLikers = useCallback(() => setShowLikers(false), []);

  // Status simpan diambil dari daftar Saved (sumber yang pasti), bukan dari field di feed
  // yang namanya belum terverifikasi. Field di feed hanya dipakai sebagai cadangan.
  const savedList = useQuery({
    queryKey: ["saved"],
    queryFn: () => getSavedPosts(token as string),
    enabled: Boolean(token),
  });
  const saved = savedList.data
    ? savedList.data.some((item) => String(item.id) === postId)
    : Boolean(post.isSaved);

  const toggleSave = useMutation({
    mutationFn: () => (saved ? unsavePost(postId, token ?? "") : savePost(postId, token ?? "")),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["saved"] });
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
    },
  });

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
        <button
          type="button"
          aria-pressed={saved}
          disabled={!token || toggleSave.isPending}
          onClick={() => toggleSave.mutate()}
          className={`ml-auto rounded-full border px-3 py-1 text-xs disabled:opacity-50 ${
            saved ? "border-violet-500 text-violet-300" : "border-neutral-700 text-neutral-300"
          }`}
        >
          {saved ? "Tersimpan" : "Simpan"}
        </button>
      </div>

      {post.caption && (
        <p className="px-4 text-sm">
          {author && <span className="mr-1 font-medium">@{author.username}</span>}
          {post.caption}
        </p>
      )}

      {(toggle.error || toggleSave.error) && (
        <p role="alert" className="mx-4 rounded-lg bg-red-950 px-3 py-2 text-xs text-red-300">
          Gagal memperbarui: {(toggle.error ?? toggleSave.error)?.message}
        </p>
      )}

      {showLikers && <LikedByModal postId={postId} token={token} onClose={closeLikers} />}
    </article>
  );
}
