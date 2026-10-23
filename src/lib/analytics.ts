/**
 * Analytics ringan (sesuai PDF): view post, like/unlike, follow/unfollow, save/unsave, komentar.
 * Saat ini event hanya dicatat ke console di mode development.
 * Untuk production, sambungkan ke layanan analytics di fungsi track() ini.
 */
export type AnalyticsEvent =
  | "post_view"
  | "like"
  | "unlike"
  | "follow"
  | "unfollow"
  | "save"
  | "unsave"
  | "comment_submit";

export function track(event: AnalyticsEvent, props: Record<string, string | number | boolean> = {}) {
  if (process.env.NODE_ENV !== "production") {
    console.info("[analytics]", event, props);
  }
}
