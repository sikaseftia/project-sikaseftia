import { z } from "zod";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB (asumsi; sesuaikan dengan batas backend)

export const createPostSchema = z.object({
  caption: z.string().max(2200, "Maksimal 2200 karakter"),
  image: z
    .custom<File | undefined>((value) => value instanceof File, "Pilih gambar terlebih dahulu")
    .refine((file) => !file || file.type.startsWith("image/"), "File harus berupa gambar")
    .refine((file) => !file || file.size <= MAX_IMAGE_BYTES, "Ukuran gambar maksimal 5 MB"),
});

export type CreatePostValues = z.infer<typeof createPostSchema>;
