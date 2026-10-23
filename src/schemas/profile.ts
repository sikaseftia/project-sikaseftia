import { z } from "zod";

/**
 * Edit Profile. Email dan nomor HP sengaja tidak ada di form ini.
 */
export const editProfileSchema = z.object({
  name: z.string().min(2, "Minimal 2 karakter"),
  username: z
    .string()
    .regex(/^[a-zA-Z0-9_.]{3,20}$/, "3–20 karakter: huruf, angka, _ atau ."),
  bio: z.string().max(160, "Maksimal 160 karakter").optional(),
});

export type EditProfileValues = z.infer<typeof editProfileSchema>;
