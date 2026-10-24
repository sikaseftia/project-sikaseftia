"use client";

import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToggleFollow } from "@/features/follow/useToggleFollow";
import { getUser } from "@/features/users/api";

type Props = {
  username: string;
  token: string | null;
};

/**
 * Tombol Ikuti / Mengikuti untuk satu akun. Tampilan langsung berubah (Optimistic UI).
 * Status diambil dari GET /api/users/{username} (field isFollowing).
 */
export default function FollowButton({ username, token }: Props) {
  const profile = useQuery({
    queryKey: ["user", username, token ?? "guest"],
    queryFn: () => getUser(username, token),
    enabled: Boolean(token),
  });

  const follow = useToggleFollow(username, token ?? "");

  if (!token || !profile.data || profile.data.isMe) return null;

  const isFollowing = Boolean(profile.data.isFollowing);

  return (
    <div className="flex shrink-0 flex-col items-end">
      <Button
        type="button"
        variant={isFollowing ? "outline" : "brand"}
        onClick={() => follow.mutate(isFollowing)}
        disabled={follow.isPending}
        className={`h-8 rounded-xl px-4 text-xs font-medium ${
          isFollowing ? "border-neutral-700 bg-transparent text-white hover:bg-neutral-900" : ""
        }`}
      >
        {isFollowing ? "Mengikuti" : "Ikuti"}
      </Button>
      {follow.error && (
        <span role="alert" className="mt-1 text-xs text-red-400">
          {follow.error.message}
        </span>
      )}
    </div>
  );
}
