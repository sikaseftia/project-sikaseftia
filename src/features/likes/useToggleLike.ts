"use client";

import { useMutation, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { likePost, unlikePost } from "@/features/likes/api";
import type { FeedPage } from "@/features/posts/feed";

type ToggleVars = { postId: string; liked: boolean };
type Feed = InfiniteData<FeedPage>;

/**
 * Like / unlike dengan Optimistic UI:
 * tampilan langsung berubah, lalu dikembalikan jika request ke server gagal.
 */
export function useToggleLike(token: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, liked }: ToggleVars) =>
      liked ? unlikePost(postId, token) : likePost(postId, token),

    onMutate: async ({ postId, liked }) => {
      // Hentikan refetch yang sedang jalan supaya tidak menimpa perubahan optimistic.
      await queryClient.cancelQueries({ queryKey: ["feed"] });
      const previous = queryClient.getQueryData<Feed>(["feed"]);

      queryClient.setQueryData<Feed>(["feed"], (feed) =>
        feed && {
          ...feed,
          pages: feed.pages.map((page) => ({
            ...page,
            items: page.items.map((post) =>
              String(post.id) === postId
                ? {
                    ...post,
                    isLiked: !liked,
                    likesCount: Math.max(0, (post.likesCount ?? 0) + (liked ? -1 : 1)),
                  }
                : post,
            ),
          })),
        },
      );

      return { previous };
    },

    onError: (_error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["feed"], context.previous);
      }
    },

    onSettled: (_data, _error, { postId }) => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["my-likes"] });
      queryClient.invalidateQueries({ queryKey: ["me"] });
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
    },
  });
}
