import { twMerge } from "tailwind-merge";

/**
 * Gabungkan class Tailwind dan selesaikan konflik (mis. h-8 vs h-10). Standar shadcn/ui.
 * Hanya string yang diproses; className berupa fungsi (base-ui) diabaikan.
 */
export function cn(...inputs: unknown[]) {
  return twMerge(inputs.filter((value): value is string => typeof value === "string" && value.length > 0).join(" "));
}
