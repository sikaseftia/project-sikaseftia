import { z } from "zod";

/**
 * Edit Profile. Email sengaja tidak ada: PATCH /api/me tidak menerima email,
 * dan email hanya diisi saat register.
 */
export const editProfileSchema = z.object({
  name: z.string().min(2, "Minimal 2 karakter"),
  username: z
    .string()
    .regex(/^[a-zA-Z0-9_.]{3,20}$/, "3–20 karakter: huruf, angka, _ atau ."),
  phone: z
    .string()
    .regex(/^\+?[0-9]{8,15}$/, "Nomor telepon tidak valid")
    .or(z.literal(""))
    .optional(),
  bio: z.string().max(160, "Maksimal 160 karakter").optional(),
});

export type EditProfileValues = z.infer<typeof editProfileSchema>;
