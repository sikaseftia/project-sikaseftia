"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import AuthGuard from "@/components/AuthGuard";
import { createPost } from "@/features/posts/api";
import { createPostSchema, type CreatePostValues } from "@/schemas/post";
import { useAppSelector } from "@/store/hooks";

function CreatePostContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const token = useAppSelector((state) => state.auth.token) as string;
  const [preview, setPreview] = useState<string | null>(null);
  const previewUrl = useRef<string | null>(null);

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreatePostValues>({
    resolver: zodResolver(createPostSchema),
    defaultValues: { caption: "", image: undefined },
  });

  // Dipanggil saat pengguna memilih file. URL preview lama dilepas supaya tidak bocor memori.
  function handleFileChange(file: File | undefined, onChange: (file?: File) => void) {
    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    const url = file ? URL.createObjectURL(file) : null;
    previewUrl.current = url;
    setPreview(url);
    onChange(file);
  }

  // Lepas URL preview terakhir saat halaman ditutup.
  useEffect(() => {
    return () => {
      if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    };
  }, []);

  const mutation = useMutation({
    mutationFn: (values: CreatePostValues) =>
      createPost(token, { image: values.image as File, caption: values.caption }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      queryClient.invalidateQueries({ queryKey: ["my-posts"] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      const created = res as { id?: number | string; post?: { id?: number | string } };
      const id = created.id ?? created.post?.id;
      router.replace(id !== undefined ? `/posts/${id}` : "/me");
    },
  });

  return (
    <section className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <Link href="/feed" className="text-sm text-neutral-400">
          Batal
        </Link>
        <h1 className="text-base font-semibold">New Post</h1>
        <span className="w-10" />
      </div>

      <form
        className="flex flex-col gap-4"
        onSubmit={handleSubmit((values) => mutation.mutate(values))}
        noValidate
      >
        <Controller
          control={control}
          name="image"
          render={({ field: { onChange, name } }) => (
            <label className="flex aspect-square cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-neutral-700 bg-neutral-950 text-sm text-neutral-400">
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="Preview gambar" className="h-full w-full object-cover" />
              ) : (
                <span>Pilih gambar</span>
              )}
              <input
                type="file"
                accept="image/*"
                name={name}
                className="sr-only"
                onChange={(e) => handleFileChange(e.target.files?.[0], onChange)}
              />
            </label>
          )}
        />
        {errors.image?.message && (
          <p className="text-sm text-red-400">{errors.image.message}</p>
        )}

        <div className="flex flex-col gap-1">
          <label htmlFor="caption" className="text-sm">
            Caption
          </label>
          <textarea
            id="caption"
            rows={3}
            placeholder="Tulis caption…"
            className="rounded-xl border border-neutral-800 bg-neutral-950 p-3 text-sm outline-none focus:border-violet-500"
            {...register("caption")}
          />
          {errors.caption?.message && (
            <p className="text-sm text-red-400">{errors.caption.message}</p>
          )}
        </div>

        {mutation.error && (
          <p role="alert" className="rounded-lg bg-red-950 px-3 py-2 text-sm text-red-300">
            {mutation.error.message}
          </p>
        )}

        <button
          type="submit"
          disabled={mutation.isPending}
          className="h-11 rounded-full bg-violet-600 text-sm font-medium disabled:opacity-60"
        >
          {mutation.isPending ? "Mengunggah…" : "Share"}
        </button>
      </form>
    </section>
  );
}

export default function NewPostPage() {
  return (
    <AuthGuard>
      <CreatePostContent />
    </AuthGuard>
  );
}
