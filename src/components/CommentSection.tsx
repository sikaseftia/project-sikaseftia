"use client";

import Link from "next/link";
import dayjs from "dayjs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addComment,
  deleteComment,
  getCommentAuthor,
  getCommentText,
  getComments,
} from "@/features/comments/api";
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

  const comments = useQuery({
    queryKey: ["comments", postId],
    queryFn: () => getComments(postId, token),
  });

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
  }

  const add = useMutation({
    mutationFn: (values: CommentValues) => addComment(postId, values.text, token),
    onSuccess: () => {
      track("comment_submit", { postId });
      reset({ text: "" });
      refreshAfterChange();
    },
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
      <h2 className="text-center text-sm font-semibold">Comments</h2>

      {comments.isPending && <p className="text-sm text-neutral-400">Memuat komentar…</p>}
      {comments.error && (
        <p role="alert" className="rounded-lg bg-red-950 px-3 py-2 text-sm text-red-300">
          {comments.error.message}
        </p>
      )}
      {comments.data && comments.data.length === 0 && (
        <div className="flex flex-col items-center gap-1 py-8 text-center">
          <p className="text-sm font-semibold">No Comments yet</p>
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
        {comments.data?.map((comment) => {
          const author = getCommentAuthor(comment);
          const isMine = Boolean(myUsername && author?.username === myUsername);
          return (
            <li key={String(comment.id)} className="flex gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-800 text-xs font-semibold">
                {author?.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={author.avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  (author?.username ?? "?").charAt(0).toUpperCase()
                )}
              </span>
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
                  {isMine && (
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

      {/* Emoji dan input komentar (Figma: "Add Comment" + "Post"). */}
      <form className="flex flex-col gap-2 border-t border-neutral-900 pt-3" onSubmit={handleSubmit((v) => add.mutate(v))} noValidate>
        <div className="flex gap-1.5 overflow-x-auto">
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => insertEmoji(emoji)}
              aria-label={`Sisipkan ${emoji}`}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-base"
            >
              {emoji}
            </button>
          ))}
        </div>
        <div className="flex h-10 items-center gap-2 rounded-full border border-neutral-800 bg-surface px-4 focus-within:border-brand">
          <input
            type="text"
            placeholder="Add Comment"
            aria-label="Tulis komentar"
            className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-neutral-500"
            {...register("text")}
          />
          <button
            type="submit"
            disabled={add.isPending}
            className="text-sm font-semibold text-brand-soft disabled:opacity-60"
          >
            {add.isPending ? "Mengirim…" : "Post"}
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
