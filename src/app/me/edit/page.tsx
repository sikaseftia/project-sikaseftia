"use client";

import { useEffect } from "react";
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
import { useAppSelector } from "@/store/hooks";

function EditProfileContent() {
  const router = useRouter();
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
    defaultValues: { name: "", username: "", phone: "", bio: "" },
  });

  // Isi form begitu data profil tersedia.
  useEffect(() => {
    if (me) {
      reset({
        name: me.name ?? "",
        username: me.username ?? "",
        phone: (me.phone as string | null | undefined) ?? "",
        bio: me.bio ?? "",
      });
    }
  }, [me, reset]);

  const mutation = useMutation({
    mutationFn: (values: EditProfileValues) =>
      updateMe(token, {
        name: values.name,
        username: values.username,
        phone: values.phone || undefined,
        bio: values.bio ?? "",
      }),
    onSuccess: () => {
      // Data profil lama tidak dipakai lagi; ambil ulang dari server.
      queryClient.invalidateQueries({ queryKey: ["me"] });
      router.replace("/me");
    },
  });

  return (
    <section className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <Link href="/me" className="text-sm text-neutral-400">
          Batal
        </Link>
        <h1 className="text-base font-semibold">Edit Profile</h1>
        <span className="w-10" />
      </div>

      {meError && (
        <p role="alert" className="rounded-lg bg-red-950 px-3 py-2 text-sm text-red-300">
          Profil gagal dimuat: {meError.message}
        </p>
      )}

      <form
        className="flex flex-col gap-4"
        onSubmit={handleSubmit((values) => mutation.mutate(values))}
        noValidate
      >
        <FormField label="Name" error={errors.name?.message} {...register("name")} />
        <FormField
          label="Username"
          autoComplete="username"
          error={errors.username?.message}
          {...register("username")}
        />
        <FormField
          label="Number Phone"
          type="tel"
          autoComplete="tel"
          error={errors.phone?.message}
          {...register("phone")}
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
          className="h-11 rounded-full bg-violet-600 text-sm font-medium disabled:opacity-60"
        >
          {mutation.isPending ? "Menyimpan…" : "Save"}
        </button>
      </form>
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
