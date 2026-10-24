import dayjs from "dayjs";

/** Waktu relatif seperti "1 minute ago", "3 hours ago". Setelah 7 hari menampilkan tanggal. */
export function timeAgo(value: string | Date): string {
  const date = dayjs(value);
  const seconds = Math.max(0, dayjs().diff(date, "second"));
  if (seconds < 60) return "Just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ${days === 1 ? "day" : "days"} ago`;

  return date.format("D MMM YYYY");
}
