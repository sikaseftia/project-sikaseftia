import Link from "next/link";
import FollowButton from "@/components/FollowButton";
import type { UserSummary } from "@/features/users/api";

type Props = {
  users: UserSummary[];
  emptyText: string;
  /** Jika diisi, setiap baris menampilkan tombol Follow / Following (kecuali akun sendiri). */
  token?: string | null;
};

/** Daftar pengguna yang dipakai di Search, Followers, Following, dan Likes. */
export default function UserList({ users, emptyText, token }: Props) {
  if (users.length === 0) {
    return <p className="text-sm text-neutral-400">{emptyText}</p>;
  }

  return (
    <ul className="flex flex-col divide-y divide-neutral-900">
      {users.map((user) => (
        <li key={user.id} className="flex items-center gap-3 py-3">
          <Link href={`/profile/${user.username}`} className="flex min-w-0 flex-1 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-800 text-sm font-medium">
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                user.name.charAt(0).toUpperCase()
              )}
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-medium">{user.name}</span>
              <span className="truncate text-xs text-neutral-400">@{user.username}</span>
            </span>
          </Link>
          {token && <FollowButton username={user.username} token={token} />}
        </li>
      ))}
    </ul>
  );
}
