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

type Props = {
  postId: string;
  token: string;
  myUsername?: string;
};

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
      reset({ text: "" });
      refreshAfterChange();
    },
  });

  const remove = useMutation({
    mutationFn: (commentId: string) => deleteComment(commentId, token),
    onSuccess: refreshAfterChange,
  });

  return (
    <section className="flex flex-col gap-4 border-t border-neutral-900 px-4 pt-4">
      <h2 className="text-sm font-semibold">Komentar</h2>

      <form className="flex flex-col gap-2" onSubmit={handleSubmit((v) => add.mutate(v))} noValidate>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Tulis komentar…"
            aria-label="Tulis komentar"
            className="h-10 flex-1 rounded-full border border-neutral-800 bg-neutral-950 px-4 text-sm outline-none focus:border-violet-500"
            {...register("text")}
          />
          <button
            type="submit"
            disabled={add.isPending}
            className="h-10 rounded-full bg-violet-600 px-4 text-sm disabled:opacity-60"
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

      {comments.isPending && <p className="text-sm text-neutral-400">Memuat komentar…</p>}
      {comments.error && (
        <p role="alert" className="rounded-lg bg-red-950 px-3 py-2 text-sm text-red-300">
          {comments.error.message}
        </p>
      )}
      {comments.data && comments.data.length === 0 && (
        <p className="text-sm text-neutral-400">Belum ada komentar.</p>
      )}

      {remove.error && (
        <p role="alert" className="rounded-lg bg-red-950 px-3 py-2 text-xs text-red-300">
          {remove.error.message}
        </p>
      )}

      <ul className="flex flex-col gap-4">
        {comments.data?.map((comment) => {
          const author = getCommentAuthor(comment);
          const isMine = Boolean(myUsername && author?.username === myUsername);
          return (
            <li key={String(comment.id)} className="flex flex-col gap-1 text-sm">
              <div className="flex items-baseline gap-2">
                {author && (
                  <Link href={`/users/${author.username}`} className="font-medium">
                    @{author.username}
                  </Link>
                )}
                {comment.createdAt && (
                  <span className="text-xs text-neutral-500">
                    {dayjs(comment.createdAt).format("D MMM YYYY, HH:mm")}
                  </span>
                )}
              </div>
              <p className="text-neutral-200">{getCommentText(comment)}</p>
              {isMine && (
                <button
                  type="button"
                  onClick={() => remove.mutate(String(comment.id))}
                  disabled={remove.isPending}
                  className="w-fit text-xs text-red-400 disabled:opacity-60"
                >
                  Hapus
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
