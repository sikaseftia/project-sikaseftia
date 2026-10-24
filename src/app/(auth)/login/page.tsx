"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { login } from "@/features/auth/api";
import { ApiError } from "@/lib/api";
import { getReturnTo } from "@/lib/navigation";
import { loginSchema, type LoginValues } from "@/schemas/auth";
import { useAppDispatch } from "@/store/hooks";
import { setToken, writeStoredToken } from "@/store/authSlice";
import FormField from "@/components/FormField";

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const mutation = useMutation({
    mutationFn: (values: LoginValues) => login(values),
    onSuccess: (token) => {
      writeStoredToken(token);
      dispatch(setToken(token));
      router.replace(getReturnTo());
    },
  });

  const serverError =
    mutation.error instanceof ApiError && mutation.error.status === 401
      ? "Email atau password salah."
      : mutation.error?.message;

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-10">
      {/* Ukuran kartu dan input mengikuti layar Login di Figma (kartu ±344px dalam frame 393px). */}
      <div className="w-full max-w-[344px] rounded-xl border border-white/10 bg-black/60 px-5 py-6">
        <div className="flex items-center justify-center gap-2 text-base font-semibold">
          <Image src="/logo.png" alt="" width={24} height={24} />
          Sociality
        </div>
        <h1 className="mt-5 text-center text-base font-semibold">Selamat Datang Kembali!</h1>

        <form
          className="mt-5 flex flex-col gap-3"
          onSubmit={handleSubmit((values) => mutation.mutate(values))}
          noValidate
        >
          <FormField
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="Masukkan email kamu"
            compact
            error={errors.email?.message}
            {...register("email")}
          />
          <FormField
            label="Kata Sandi"
            type="password"
            autoComplete="current-password"
            placeholder="Masukkan kata sandi kamu"
            compact
            error={errors.password?.message}
            {...register("password")}
          />

          {serverError && (
            <p role="alert" className="rounded-lg bg-red-950 px-3 py-2 text-sm text-red-300">
              {serverError}
            </p>
          )}

          <button
            type="submit"
            disabled={mutation.isPending}
            className="mt-1 h-9 rounded-xl bg-brand text-sm font-medium disabled:opacity-60"
          >
            {mutation.isPending ? "Memproses…" : "Login"}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-neutral-400">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium text-brand-soft">
            Daftar
          </Link>
        </p>
      </div>
    </div>
  );
}
