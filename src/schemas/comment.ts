import { z } from "zod";

export const commentSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, "Komentar tidak boleh kosong")
    .max(500, "Maksimal 500 karakter"),
});

export type CommentValues = z.infer<typeof commentSchema>;
