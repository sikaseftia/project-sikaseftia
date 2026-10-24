"use client";

import { useQuery } from "@tanstack/react-query";
import { getMe } from "@/features/auth/api";
import { useAppSelector } from "@/store/hooks";

type Props = {
  username: string;
  avatarUrl?: string | null;
  /** Ukuran dan gaya huruf, contoh: "h-8 w-8 text-xs font-semibold". */
  className?: string;
};

/**
 * Avatar yang sama di semua tempat (feed, komentar, search, daftar).
 * Jika respons server tidak menyertakan foto untuk akun sendiri, foto diambil dari /api/me.
 */
export default function Avatar({ username, avatarUrl, className = "h-8 w-8 text-xs font-semibold" }: Props) {
  const token = useAppSelector((state) => state.auth.token);

  const me = useQuery({
    queryKey: ["me"],
    queryFn: () => getMe(token as string),
    enabled: Boolean(token),
  });

  const isMe = Boolean(me.data && me.data.username === username);
  const myAvatar = me.data?.avatarUrl as string | null | undefined;
  const src = avatarUrl || (isMe ? myAvatar : undefined);

  return (
    <span
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-800 ${className}`}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        username.charAt(0).toUpperCase()
      )}
    </span>
  );
}
