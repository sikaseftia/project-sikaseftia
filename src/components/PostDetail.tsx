"use client";

import { ErrorMessage, EmptyMessage, LoadingMessage } from "@/components/StateMessages";
import Avatar from "@/components/Avatar";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { track } from "@/lib/analytics";
import { getMe } from "@/features/auth/api";
import { deletePost, getPost, getPostAuthor, getPostImage } from "@/features/posts/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import CommentSection from "@/components/CommentSection";
import FollowButton from "@/components/FollowButton";
import PostActions from "@/components/PostActions";
import type { LikeablePost } from "@/features/likes/api";
import { useAppSelector } from "@/store/hooks";

type Props = {
  id: string;
  /** true jika tampil di overlay: foto kiri, caption dan komentar kanan (desktop). */
  embedded?: boolean;
};

export default function PostDetail({ id, embedded = false }: Props) {
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
    return <LoadingMessage text="Memuat post…" />;
  }

  if (post.error) {
    return (
      <section className="p-6">
        <ErrorMessage message={`Post gagal dimuat: ${post.error.message}`} onRetry={() => post.refetch()} retrying={post.isFetching} />
      </section>
    );
  }

  const data = post.data;
  const src = getPostImage(data);
  const author = getPostAuthor(data);
  // Hanya pemilik post yang boleh melihat tombol hapus.
  const isOwner = Boolean(author && me.data && author.username === me.data.username);

  const authorRow = author && (
    <div className="flex items-center gap-3 px-4 pt-4">
      <Link href={`/profile/${author.username}`} className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar username={author.username} avatarUrl={author.avatarUrl} className="h-9 w-9 text-sm font-medium" />
        <span className="truncate text-sm font-medium">@{author.username}</span>
      </Link>
      {!isOwner && <FollowButton username={author.username} token={token} />}
    </div>
  );

  const image = src && (
    <div
      className={`aspect-square w-full bg-neutral-900${
        embedded ? " md:aspect-auto md:h-full md:min-w-0 md:flex-1 md:bg-black md:flex md:items-center md:justify-center" : ""
      }`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={data.caption || `Foto post dari @${author?.username ?? "pengguna"}`}
        className={`h-full w-full object-cover${embedded ? " md:object-contain" : ""}`}
      />
    </div>
  );

  const details = (
    <>
      {embedded && authorRow}

      <PostActions post={data as LikeablePost} token={token} />

      {data.caption && (
        <p className="px-4 text-sm leading-relaxed">
          {author && <span className="mr-1.5 font-semibold">@{author.username}</span>}
          {data.caption}
        </p>
      )}

      {remove.error && (
        <p role="alert" className="mx-4 rounded-xl bg-red-950 px-3 py-2 text-sm text-red-300">
          {remove.error.message}
        </p>
      )}

      {isOwner && (
        <div className="px-4">
          <Dialog open={confirming} onOpenChange={setConfirming}>
            <DialogTrigger
              render={
                <Button
                  variant="outline"
                  className="h-10 w-full rounded-full border-red-900 bg-transparent text-sm text-red-400 hover:bg-red-950/40"
                />
              }
            >
              Hapus post
            </DialogTrigger>
            <DialogContent className="bg-neutral-950 text-white ring-neutral-800 sm:max-w-sm">
              <DialogHeader>
                <DialogTitle className="text-white">Hapus post ini?</DialogTitle>
                <DialogDescription className="text-neutral-400">
                  Post yang sudah dihapus tidak bisa dikembalikan.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="border-neutral-800 bg-neutral-900/50">
                <Button
                  variant="outline"
                  onClick={() => setConfirming(false)}
                  className="h-10 flex-1 rounded-full border-neutral-700 bg-transparent text-sm text-white hover:bg-neutral-900"
                >
                  Batal
                </Button>
                <Button
                  onClick={() => remove.mutate()}
                  disabled={remove.isPending}
                  className="h-10 flex-1 rounded-full bg-red-700 text-sm text-white hover:bg-red-600"
                >
                  {remove.isPending ? "Menghapus…" : "Ya, hapus"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {token && <CommentSection postId={id} token={token} myUsername={me.data?.username} />}
    </>
  );

  return (
    <section className={`flex flex-col pb-6${embedded ? " md:h-full md:flex-row md:pb-0" : ""}`}>
      {!embedded && authorRow}
      {image}
      {embedded ? (
        <div className="flex flex-col gap-4 md:h-full md:w-[360px] md:shrink-0 md:overflow-y-auto md:border-l md:border-neutral-900 md:py-4">
          {details}
        </div>
      ) : (
        <div className="flex flex-col gap-4 pt-4">{details}</div>
      )}
    </section>
  );
}

