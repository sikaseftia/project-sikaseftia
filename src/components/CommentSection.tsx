"use client";

import { useState } from "react";
import Avatar from "@/components/Avatar";
import Link from "next/link";
import dayjs from "dayjs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import {
  addComment,
  deleteComment,
  type Comment,
  getCommentAuthor,
  getCommentText,
  getCommentsPage,
} from "@/features/comments/api";
import LoadMoreButton from "@/components/LoadMoreButton";
import { COMMENT_PAGE_SIZE, pageResult, type Paged } from "@/lib/paging";
import { commentSchema, type CommentValues } from "@/schemas/comment";
import { ApiError } from "@/lib/api";
import { track } from "@/lib/analytics";

type Props = {
  postId: string;
  token: string;
  myUsername?: string;
};

// Emoji cepat seperti pada layar "Select Emoji" di Figma.
const QUICK_EMOJIS = ["😍", "😂", "🔥", "👏", "😮", "❤️"];

export default function CommentSection({ postId, token, myUsername }: Props) {
  const queryClient = useQueryClient();
  const [showEmoji, setShowEmoji] = useState(false);

  const commentsKey = ["comments", postId] as const;
  const comments = useInfiniteQuery({
    queryKey: commentsKey,
    queryFn: ({ pageParam }) =>
      getCommentsPage(postId, pageParam, COMMENT_PAGE_SIZE, token).then((r) =>
        pageResult(pageParam, r, COMMENT_PAGE_SIZE),
      ),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.hasNext ? last.page + 1 : undefined),
  });
  const commentItems = comments.data?.pages.flatMap((p) => p.items);

  const {
    register,
    handleSubmit,
    reset,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<CommentValues>({
    resolver: zodResolver(commentSchema),
    defaultValues: { text: "" },
  });

  function refreshAfterChange() {
    queryClient.invalidateQueries({ queryKey: ["comments", postId] });
    queryClient.invalidateQueries({ queryKey: ["post", postId] });
    queryClient.invalidateQueries({ queryKey: ["feed"] });
  }

  const add = useMutation({
    mutationFn: (values: CommentValues) => addComment(postId, values.text, token),
    onMutate: async (values) => {
      await queryClient.cancelQueries({ queryKey: commentsKey });
      const previous = queryClient.getQueryData<InfiniteData<Paged<Comment>>>(commentsKey);
      const me = queryClient.getQueryData<{ username: string; name?: string; avatarUrl?: string | null }>(["me"]);
      // Komentar sementara: langsung tampil, id berawalan "temp-" supaya tidak bisa dihapus sebelum tersimpan.
      const optimistic = {
        id: `temp-${Date.now()}`,
        content: values.text,
        createdAt: new Date().toISOString(),
        author: { username: me?.username ?? "saya", name: me?.name, avatarUrl: me?.avatarUrl ?? null },
      } as Comment;
      // Komentar baru ditempel di halaman terakhir yang sudah dimuat.
      queryClient.setQueryData<InfiniteData<Paged<Comment>>>(commentsKey, (old) => {
        if (!old || old.pages.length === 0) return old;
        const pages = [...old.pages];
        const last = pages.length - 1;
        pages[last] = { ...pages[last], items: [...pages[last].items, optimistic] };
        return { ...old, pages };
      });
      reset({ text: "" });
      return { previous, text: values.text };
    },
    onError: (_error, _values, context) => {
      if (context?.previous) queryClient.setQueryData(commentsKey, context.previous);
      // Teks dikembalikan ke kolom supaya bisa dikirim ulang.
      if (context) reset({ text: context.text });
    },
    onSuccess: () => {
      track("comment_submit", { postId });
    },
    onSettled: refreshAfterChange,
  });

  const remove = useMutation({
    mutationFn: (commentId: string) => deleteComment(commentId, token),
    onSuccess: refreshAfterChange,
  });

  function insertEmoji(emoji: string) {
    setValue("text", `${getValues("text")}${emoji}`, { shouldDirty: true });
  }

  return (
    <section className="flex flex-col gap-4 px-4 pt-4">
      <h2 className="text-sm font-semibold">Komentar</h2>

      {comments.isPending && <p className="text-sm text-neutral-400">Memuat komentar…</p>}
      {comments.error && (
        <p role="alert" className="rounded-lg bg-red-950 px-3 py-2 text-sm text-red-300">
          {comments.error.message}
        </p>
      )}
      {commentItems && commentItems.length === 0 && (
        <div className="flex flex-col items-center gap-1 py-8 text-center">
          <p className="text-sm font-semibold">Belum ada komentar</p>
          <p className="text-xs text-neutral-500">Jadilah yang pertama berkomentar.</p>
        </div>
      )}

      {remove.error && (
        <p role="alert" className="rounded-lg bg-red-950 px-3 py-2 text-xs text-red-300">
          {remove.error.message}
        </p>
      )}

      {/* Daftar komentar dengan gaya bubble (Figma). */}
      <ul className="flex flex-col gap-4">
        {commentItems?.map((comment) => {
          const author = getCommentAuthor(comment);
          const isMine = Boolean(myUsername && author?.username === myUsername);
          const pending = String(comment.id).startsWith("temp-");
          return (
            <li key={String(comment.id)} className={`flex gap-2.5 ${pending ? "opacity-60" : ""}`}>
              <Avatar username={author?.username ?? "?"} avatarUrl={author?.avatarUrl} className="h-8 w-8 text-xs font-semibold" />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="rounded-2xl bg-neutral-900 px-3 py-2 text-sm">
                  {author && (
                    <Link href={`/profile/${author.username}`} className="block text-xs font-semibold">
                      {author.username}
                    </Link>
                  )}
                  <p className="break-words text-neutral-200">{getCommentText(comment)}</p>
                </div>
                <div className="flex gap-3 px-1 text-[11px] text-neutral-500">
                  {comment.createdAt && <span>{dayjs(comment.createdAt).format("D MMM YYYY, HH:mm")}</span>}
                  {isMine && !pending && (
                    <button
                      type="button"
                      onClick={() => remove.mutate(String(comment.id))}
                      disabled={remove.isPending}
                      className="text-red-400 disabled:opacity-60"
                    >
                      Hapus
                    </button>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      <LoadMoreButton
        hasNext={Boolean(comments.hasNextPage)}
        loading={comments.isFetchingNextPage}
        onClick={() => comments.fetchNextPage()}
      />

      {/* Emoji dan input komentar (Figma: "Add Comment" + "Post"). */}
      <form className="flex flex-col gap-2 border-t border-neutral-900 pt-3" onSubmit={handleSubmit((v) => add.mutate(v))} noValidate>
        {showEmoji && (
          <div className="grid grid-cols-6 gap-1 rounded-2xl bg-neutral-900 p-2">
            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => insertEmoji(emoji)}
                aria-label={`Sisipkan ${emoji}`}
                className="flex h-9 items-center justify-center rounded-full text-lg hover:bg-neutral-800"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
        <div className="flex h-10 items-center gap-2 rounded-full border border-neutral-800 bg-surface px-3 focus-within:border-brand">
          <button
            type="button"
            onClick={() => setShowEmoji((v) => !v)}
            aria-label="Pilih emoji"
            aria-expanded={showEmoji}
            className="flex h-7 w-7 shrink-0 items-center justify-center text-neutral-300"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <path d="M8 14s1.5 2 4 2 4-2 4-2" />
              <path d="M9 9h.01M15 9h.01" />
            </svg>
          </button>
          <input
            type="text"
            placeholder="Tambahkan komentar"
            aria-label="Tulis komentar"
            className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-neutral-500"
            {...register("text")}
          />
          <button
            type="submit"
            disabled={add.isPending}
            className="text-sm font-semibold text-brand-soft disabled:opacity-60"
          >
            {add.isPending ? "Mengirim…" : "Kirim"}
          </button>
        </div>
        {errors.text?.message && <p className="text-xs text-red-400">{errors.text.message}</p>}
        {add.error && (
          <div role="alert" className="flex flex-col gap-2 rounded-lg bg-red-950 px-3 py-2 text-xs text-red-300">
            <p>Gagal mengirim komentar: {add.error.message}</p>
            {add.error instanceof ApiError && add.error.details !== undefined && (
              <pre className="overflow-x-auto whitespace-pre-wrap text-[11px] text-red-200">
                {JSON.stringify(add.error.details, null, 2)}
              </pre>
            )}
          </div>
        )}
      </form>
    </section>
  );
}
