"use client";

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
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-2xl border border-neutral-900 bg-neutral-950 p-6">
        <h1 className="text-center text-xl font-semibold">Sociality</h1>
        <h2 className="mt-4 text-center text-lg font-semibold">Welcome Back!</h2>

        <form
          className="mt-6 flex flex-col gap-4"
          onSubmit={handleSubmit((values) => mutation.mutate(values))}
          noValidate
        >
          <FormField
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="Enter your email"
            error={errors.email?.message}
            {...register("email")}
          />
          <FormField
            label="Password"
            type="password"
            autoComplete="current-password"
            placeholder="Enter your password"
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
            className="h-11 rounded-full bg-violet-600 text-sm font-medium disabled:opacity-60"
          >
            {mutation.isPending ? "Memproses…" : "Login"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-400">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium text-violet-400">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
