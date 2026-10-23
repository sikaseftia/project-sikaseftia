"use client";

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
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-2xl border border-neutral-900 bg-neutral-950 p-6">
        <h1 className="text-center text-xl font-semibold">Sociality</h1>
        <h2 className="mt-4 text-center text-lg font-semibold">Register</h2>

        <form
          className="mt-6 flex flex-col gap-4"
          onSubmit={handleSubmit((values) => mutation.mutate(values))}
          noValidate
        >
          <FormField
            label="Name"
            placeholder="Enter your name"
            error={errors.name?.message}
            {...register("name")}
          />
          <FormField
            label="Username"
            placeholder="Enter your username"
            autoComplete="username"
            error={errors.username?.message}
            {...register("username")}
          />
          <FormField
            label="Email"
            type="email"
            placeholder="Enter your email"
            autoComplete="email"
            error={errors.email?.message}
            {...register("email")}
          />
          <FormField
            label="Number Phone"
            type="tel"
            placeholder="Enter your number phone"
            autoComplete="tel"
            error={errors.phone?.message}
            {...register("phone")}
          />
          <FormField
            label="Password"
            type="password"
            placeholder="Enter your password"
            autoComplete="new-password"
            error={errors.password?.message}
            {...register("password")}
          />
          <FormField
            label="Confirm Password"
            type="password"
            placeholder="Enter your confirm password"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            {...register("confirmPassword")}
          />

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
            {mutation.isPending ? "Memproses…" : "Submit"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-400">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-violet-400">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
