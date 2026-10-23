"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import AuthGuard from "@/components/AuthGuard";
import { getMe } from "@/features/auth/api";
import { createPost } from "@/features/posts/api";
import { createPostSchema, type CreatePostValues } from "@/schemas/post";
import { useAppSelector } from "@/store/hooks";

function CreatePostContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const token = useAppSelector((state) => state.auth.token) as string;
  const [preview, setPreview] = useState<string | null>(null);
  const previewUrl = useRef<string | null>(null);

  // Avatar kecil di kanan atas (Figma).
  const me = useQuery({
    queryKey: ["me"],
    queryFn: () => getMe(token),
    enabled: Boolean(token),
  });
  const myAvatar = me.data?.avatarUrl as string | null | undefined;
  const myInitial = (me.data?.name ?? "?").charAt(0).toUpperCase();

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreatePostValues>({
    resolver: zodResolver(createPostSchema),
    defaultValues: { caption: "", image: undefined },
  });

  // Dipanggil saat pengguna memilih atau menghapus file. URL preview lama dilepas supaya tidak bocor memori.
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
    <section className="flex flex-col gap-5 px-4 py-5">
      {/* Judul dengan panah kembali dan avatar di kanan (Figma: "← Add Post"). */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/feed" aria-label="Kembali" className="text-lg text-neutral-300">
            ←
          </Link>
          <h1 className="text-base font-semibold">Add Post</h1>
        </div>
        <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-neutral-800 text-xs font-semibold">
          {myAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={myAvatar} alt="" className="h-full w-full object-cover" />
          ) : (
            myInitial
          )}
        </span>
      </div>

      <form
        className="flex flex-col gap-5"
        onSubmit={handleSubmit((values) => mutation.mutate(values))}
        noValidate
      >
        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold">Photo</span>
          <Controller
            control={control}
            name="image"
            render={({ field: { onChange, name } }) => (
              <>
                {preview ? (
                  <div className="flex flex-col gap-3 rounded-xl border border-dashed border-neutral-700 p-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={preview} alt="Preview gambar" className="aspect-[4/5] w-full rounded-lg object-cover" />
                    <div className="flex justify-center gap-2">
                      <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-neutral-700 px-3 py-1.5 text-xs">
                        Change Image
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          name={name}
                          className="sr-only"
                          onChange={(e) => handleFileChange(e.target.files?.[0], onChange)}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => handleFileChange(undefined, onChange)}
                        className="rounded-lg border border-red-900 px-3 py-1.5 text-xs text-red-400"
                      >
                        Delete Image
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-neutral-700 bg-surface px-4 py-10 text-center">
                    <span className="text-2xl text-neutral-400" aria-hidden="true">⤒</span>
                    <span className="text-xs text-neutral-400">
                      <span className="font-medium text-brand-soft">Click to upload</span> or drag and drop
                    </span>
                    <span className="text-[11px] text-neutral-500">PNG or JPG (max. 5MB)</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      name={name}
                      className="sr-only"
                      onChange={(e) => handleFileChange(e.target.files?.[0], onChange)}
                    />
                  </label>
                )}
              </>
            )}
          />
          {errors.image?.message && (
            <p className="text-xs text-red-400">{errors.image.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="caption" className="text-sm font-semibold">
            Caption
          </label>
          <textarea
            id="caption"
            rows={5}
            placeholder="Create your caption"
            className={`rounded-xl border bg-surface p-3 text-sm leading-relaxed outline-none placeholder:text-neutral-500 focus:border-brand ${
              errors.caption ? "border-red-500" : "border-neutral-800"
            }`}
            {...register("caption")}
          />
          {errors.caption?.message && (
            <p className="text-xs text-red-400">{errors.caption.message}</p>
          )}
        </div>

        {mutation.error && (
          <p role="alert" className="rounded-lg bg-red-950 px-3 py-2 text-sm text-red-300">
            Gagal membagikan post: {mutation.error.message}
          </p>
        )}

        <button
          type="submit"
          disabled={mutation.isPending}
          className="h-11 rounded-lg bg-brand text-sm font-medium disabled:opacity-60"
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
