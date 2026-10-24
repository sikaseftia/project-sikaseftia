"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { login, register as registerUser } from "@/features/auth/api";
import { registerSchema, type RegisterValues } from "@/schemas/auth";
import { setToken, writeStoredToken } from "@/store/authSlice";
import { useAppDispatch } from "@/store/hooks";
import FormField from "@/components/FormField";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      username: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: RegisterValues) => {
      // confirmPassword hanya untuk validasi di frontend, tidak dikirim ke API.
      await registerUser({
        name: values.name,
        username: values.username,
        email: values.email,
        phone: values.phone || undefined,
        password: values.password,
      });
      // Register belum tentu mengembalikan token, jadi kita login otomatis.
      return login({ email: values.email, password: values.password });
    },
    onSuccess: (token) => {
      writeStoredToken(token);
      dispatch(setToken(token));
      router.replace("/feed");
    },
  });

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-10">
      {/* Kartu mengikuti layar Register di Figma, sama dengan halaman Login. */}
      <div className="w-full max-w-[344px] rounded-xl border border-white/10 bg-black/60 px-5 py-6">
        <div className="flex items-center justify-center gap-2 text-base font-semibold">
          <Image src="/logo.png" alt="" width={24} height={24} />
          Sociality
        </div>
        <h2 className="mt-5 text-center text-base font-semibold">Daftar</h2>

        <form
          className="mt-5 flex flex-col gap-3"
          onSubmit={handleSubmit((values) => mutation.mutate(values))}
          noValidate
        >
          <FormField
            label="Nama"
            placeholder="Masukkan nama kamu"
            error={errors.name?.message}
            {...register("name")}
            compact
          />
          <FormField
            label="Username"
            placeholder="Masukkan username kamu"
            autoComplete="username"
            error={errors.username?.message}
            {...register("username")}
            compact
          />
          <FormField
            label="Email"
            type="email"
            placeholder="Masukkan email kamu"
            autoComplete="email"
            error={errors.email?.message}
            {...register("email")}
            compact
          />
          <FormField
            label="Nomor Telepon"
            type="tel"
            placeholder="Masukkan nomor telepon kamu"
            autoComplete="tel"
            error={errors.phone?.message}
            {...register("phone")}
            compact
          />
          <FormField
            label="Kata Sandi"
            type="password"
            placeholder="Masukkan kata sandi kamu"
            autoComplete="new-password"
            error={errors.password?.message}
            {...register("password")}
            compact
          />
          <FormField
            label="Konfirmasi Kata Sandi"
            type="password"
            placeholder="Masukkan ulang kata sandi kamu"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            {...register("confirmPassword")}
            compact
          />

          {mutation.error && (
            <p role="alert" className="rounded-lg bg-red-950 px-3 py-2 text-sm text-red-300">
              {mutation.error.message}
            </p>
          )}

          <Button type="submit" variant="brand" disabled={mutation.isPending} className="mt-1 h-9 rounded-xl text-sm font-medium">
            {mutation.isPending ? "Memproses…" : "Submit"}
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-neutral-400">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-brand-soft">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
