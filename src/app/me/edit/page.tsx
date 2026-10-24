"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import AuthGuard from "@/components/AuthGuard";
import FormField from "@/components/FormField";
import { getMe } from "@/features/auth/api";
import { updateMe } from "@/features/users/api";
import { editProfileSchema, type EditProfileValues } from "@/schemas/profile";
import { clearSession, writeStoredToken } from "@/store/authSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

function EditProfileContent() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const fileInput = useRef<HTMLInputElement>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const token = useAppSelector((state) => state.auth.token) as string;

  const { data: me, error: meError } = useQuery({
    queryKey: ["me"],
    queryFn: () => getMe(token),
    enabled: Boolean(token),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditProfileValues>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: { name: "", username: "", bio: "" },
  });

  // Isi form begitu data profil tersedia.
  useEffect(() => {
    if (me) {
      reset({
        name: me.name ?? "",
        username: me.username ?? "",
        bio: me.bio ?? "",
      });
    }
  }, [me, reset]);

  // Lepaskan URL preview saat foto diganti atau halaman ditutup.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function onPickFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // agar file yang sama bisa dipilih ulang
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setFileError("Format foto harus JPG, PNG, atau WEBP.");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setFileError("Ukuran foto maksimal 5 MB.");
      return;
    }
    setFileError(null);
    setAvatarFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  const mutation = useMutation({
    mutationFn: (values: EditProfileValues) =>
      updateMe(token, {
        name: values.name,
        username: values.username,
        bio: values.bio ?? "",
        avatar: avatarFile,
      }),
    // Teks profil bisa tersimpan walaupun upload foto gagal, jadi cache dibersihkan di kedua kondisi.
    onSettled: () => {
      queryClient.invalidateQueries();
    },
    onSuccess: () => {
      router.replace("/me");
    },
  });

  function handleLogout() {
    writeStoredToken(null);
    dispatch(clearSession());
    queryClient.clear();
    router.replace("/login");
  }

  const serverAvatar = me?.avatarUrl as string | null | undefined;
  const avatarUrl = previewUrl ?? serverAvatar;
  const initial = (me?.name ?? "?").charAt(0).toUpperCase();

  return (
    <section className="flex flex-col gap-6 px-4 py-5">
      <div className="flex items-center justify-between">
        <Link href="/me" aria-label="Kembali" className="text-lg text-neutral-300">
          ←
        </Link>
        <h1 className="text-base font-semibold">Edit Profil</h1>
        <span className="w-4" />
      </div>

      {meError && (
        <p role="alert" className="rounded-lg bg-red-950 px-3 py-2 text-sm text-red-300">
          Profil gagal dimuat: {meError.message}
        </p>
      )}

      {/* Figma: foto profil di kiri, field form di kanan. */}
      <div className="flex items-start gap-4">
      {/* Foto profil: pratinjau langsung, diunggah saat Save Changes. */}
      <div className="flex w-24 shrink-0 flex-col items-center gap-3">
        <span className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-neutral-800 text-2xl font-semibold">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            initial
          )}
        </span>
        <input
          ref={fileInput}
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          onChange={onPickFile}
          className="hidden"
          aria-label="Pilih foto profil"
        />
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          className="rounded-xl border border-neutral-700 px-3 py-1.5 text-xs text-neutral-200"
        >
          Ganti Foto
        </button>
        {avatarFile && (
          <p className="text-xs text-neutral-500">Foto baru akan disimpan saat kamu menekan Simpan Perubahan.</p>
        )}
        {fileError && (
          <p role="alert" className="text-xs text-red-400">
            {fileError}
          </p>
        )}
      </div>

      <form
        className="flex min-w-0 flex-1 flex-col gap-4"
        onSubmit={handleSubmit((values) => mutation.mutate(values))}
        noValidate
      >
        <FormField label="Nama" error={errors.name?.message} {...register("name")} />
        <FormField
          label="Username"
          autoComplete="username"
          error={errors.username?.message}
          {...register("username")}
        />
        <FormField label="Bio" error={errors.bio?.message} {...register("bio")} />

        {mutation.error && (
          <p role="alert" className="rounded-lg bg-red-950 px-3 py-2 text-sm text-red-300">
            {mutation.error.message}
          </p>
        )}

        <button
          type="submit"
          disabled={mutation.isPending || !me}
          className="h-11 rounded-xl bg-brand text-sm font-medium disabled:opacity-60"
        >
          {mutation.isPending ? "Menyimpan…" : "Simpan Perubahan"}
        </button>
      </form>
      </div>

      {/* Pengaturan akun: keluar dari akun (pindah dari tab Pengaturan di /me). */}
      <div className="flex flex-col gap-3 border-t border-neutral-900 pt-5">
        <h2 className="text-sm font-semibold">Pengaturan akun</h2>
        <button
          type="button"
          onClick={handleLogout}
          className="h-11 rounded-xl border border-red-900 text-sm text-red-400"
        >
          Keluar
        </button>
      </div>
    </section>
  );
}

export default function EditProfilePage() {
  return (
    <AuthGuard>
      <EditProfileContent />
    </AuthGuard>
  );
}
