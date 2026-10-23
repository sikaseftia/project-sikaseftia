import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Format email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Nama minimal 2 karakter"),
    username: z
      .string()
      .trim()
      .regex(
        /^[a-zA-Z0-9_.]{3,20}$/,
        "Username 3–20 karakter: huruf, angka, titik, atau underscore",
      ),
    email: z.email("Format email tidak valid"),
    phone: z
      .string()
      .trim()
      .regex(/^\+?[0-9]{8,15}$/, "Nomor HP tidak valid")
      .or(z.literal(""))
      .optional(),
    password: z.string().min(6, "Password minimal 6 karakter"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Konfirmasi password tidak sama",
    path: ["confirmPassword"],
  });

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
