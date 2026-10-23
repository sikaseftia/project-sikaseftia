"use client";

import { useEffect, useState } from "react";
import { track } from "@/lib/analytics";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getMe } from "@/features/auth/api";
import { deletePost, getPost, getPostAuthor, getPostImage } from "@/features/posts/api";
import CommentSection from "@/components/CommentSection";
import FollowButton from "@/components/FollowButton";
import { useAppSelector } from "@/store/hooks";

export default function PostDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const queryClient = useQueryClient();
  const token = useAppSelector((state) => state.auth.token);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    track("post_view", { postId: id });
  }, [id]);

  const post = useQuery({
    queryKey: ["post", id],
    queryFn: () => getPost(id, token),
  });

  // Data pengguna login, untuk menentukan apakah tombol hapus ditampilkan.
  const me = useQuery({
    queryKey: ["me"],
    queryFn: () => getMe(token as string),
    enabled: Boolean(token),
  });

  const remove = useMutation({
    mutationFn: () => deletePost(id, token as string),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      queryClient.invalidateQueries({ queryKey: ["my-posts"] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.removeQueries({ queryKey: ["post", id] });
      router.replace("/me");
    },
  });

  if (post.isPending) {
    return <p className="p-6 text-sm text-neutral-400">Memuat post…</p>;
  }

  if (post.error) {
    return (
      <section className="p-6">
        <p role="alert" className="rounded-lg bg-red-950 px-3 py-2 text-sm text-red-300">
          Post gagal dimuat: {post.error.message}
        </p>
      </section>
    );
  }

  const data = post.data;
  const src = getPostImage(data);
  const author = getPostAuthor(data);
  // Hanya pemilik post yang boleh melihat tombol hapus.
  const isOwner = Boolean(author && me.data && author.username === me.data.username);

  return (
    <section className="flex flex-col gap-4 pb-6">
      {author && (
        <div className="flex items-center gap-3 px-4 pt-4">
        <Link href={`/profile/${author.username}`} className="flex min-w-0 flex-1 items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-800 text-sm font-medium">
            {author.username.charAt(0).toUpperCase()}
          </span>
          <span className="truncate text-sm font-medium">@{author.username}</span>
        </Link>
        {!isOwner && <FollowButton username={author.username} token={token} />}
        </div>
      )}

      {src && (
        <div className="aspect-square w-full bg-neutral-900">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={data.caption || `Foto post dari @${author?.username ?? "pengguna"}`}
            className="h-full w-full object-cover"
          />
        </div>
      )}

      {data.caption && <p className="px-4 text-sm">{data.caption}</p>}

      {remove.error && (
        <p role="alert" className="mx-4 rounded-lg bg-red-950 px-3 py-2 text-sm text-red-300">
          {remove.error.message}
        </p>
      )}

      {isOwner && (
        <div className="px-4">
          {!confirming ? (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="h-10 w-full rounded-full border border-red-900 text-sm text-red-400"
            >
              Hapus post
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="h-10 flex-1 rounded-full border border-neutral-700 text-sm"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => remove.mutate()}
                disabled={remove.isPending}
                className="h-10 flex-1 rounded-full bg-red-700 text-sm disabled:opacity-60"
              >
                {remove.isPending ? "Menghapus…" : "Ya, hapus"}
              </button>
            </div>
          )}
        </div>
      )}

      {token && (
        <CommentSection postId={id} token={token} myUsername={me.data?.username} />
      )}
    </section>
  );
}
