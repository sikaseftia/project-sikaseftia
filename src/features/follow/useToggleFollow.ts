"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { followUser, unfollowUser } from "@/features/follow/api";
import type { UserProfile } from "@/features/users/api";
import { track } from "@/lib/analytics";

/**
 * Follow / unfollow dengan Optimistic UI: status dan jumlah followers berubah dulu,
 * lalu dikembalikan jika request gagal. Aman diklik berulang (idempoten): data disinkronkan
 * ulang dari server setelah respons datang.
 */
export function useToggleFollow(username: string, token: string) {
  const queryClient = useQueryClient();

  return useMutation({
    // Argumen = status SAAT INI (true jika sudah mengikuti, lalu akan di-unfollow).
    mutationFn: (isFollowing: boolean) =>
      isFollowing ? unfollowUser(username, token) : followUser(username, token),

    onMutate: async (isFollowing) => {
      await queryClient.cancelQueries({ queryKey: ["user", username] });
      const snapshots = queryClient.getQueriesData<UserProfile>({ queryKey: ["user", username] });

      queryClient.setQueriesData<UserProfile>({ queryKey: ["user", username] }, (old) => {
        // Query tab (posts/likes) berbentuk array dan tidak ikut diubah.
        if (!old || Array.isArray(old)) return old;
        return {
          ...old,
          isFollowing: !isFollowing,
          followersCount: Math.max(0, (old.followersCount ?? 0) + (isFollowing ? -1 : 1)),
        };
      });

      return { snapshots };
    },

    onError: (_error, _vars, context) => {
      context?.snapshots.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },

    onSuccess: (_data, isFollowing) => {
      track(isFollowing ? "unfollow" : "follow", { username });
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["user", username] });
      queryClient.invalidateQueries({ queryKey: ["me"] });
      queryClient.invalidateQueries({ queryKey: ["followers", username] });
      queryClient.invalidateQueries({ queryKey: ["following"] });
      queryClient.invalidateQueries({ queryKey: ["my-following-list"] });
      queryClient.invalidateQueries({ queryKey: ["my-following"] });
    },
  });
}
