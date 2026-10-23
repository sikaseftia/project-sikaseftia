"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { followUser, unfollowUser } from "@/features/follow/api";
import { getUser } from "@/features/users/api";

type Props = {
  username: string;
  token: string | null;
};

/**
 * Tombol Follow / Following untuk satu akun.
 * Status diambil dari GET /api/users/{username} (field isFollowing), bentuk yang sama
 * dengan halaman profil, jadi tidak bergantung pada respons search atau daftar lain.
 */
export default function FollowButton({ username, token }: Props) {
  const queryClient = useQueryClient();

  const profile = useQuery({
    queryKey: ["user", username, token ?? "guest"],
    queryFn: () => getUser(username, token),
    enabled: Boolean(token),
  });

  const follow = useMutation({
    mutationFn: (isFollowing: boolean) =>
      isFollowing ? unfollowUser(username, token as string) : followUser(username, token as string),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["user", username] });
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });

  if (!token || !profile.data || profile.data.isMe) return null;

  const isFollowing = Boolean(profile.data.isFollowing);

  return (
    <div className="flex shrink-0 flex-col items-end">
      <button
        type="button"
        onClick={() => follow.mutate(isFollowing)}
        disabled={follow.isPending}
        className={`h-8 rounded-lg px-4 text-xs font-medium disabled:opacity-60 ${
          isFollowing ? "border border-neutral-700" : "bg-brand"
        }`}
      >
        {follow.isPending ? "…" : isFollowing ? "Following" : "Follow"}
      </button>
      {follow.error && (
        <span role="alert" className="mt-1 text-xs text-red-400">
          {follow.error.message}
        </span>
      )}
    </div>
  );
}
