import Link from "next/link";
import type { UserSummary } from "@/features/users/api";

type Props = {
  users: UserSummary[];
  emptyText: string;
};

/** Daftar pengguna yang dipakai di Search, Followers, dan Following. */
export default function UserList({ users, emptyText }: Props) {
  if (users.length === 0) {
    return <p className="text-sm text-neutral-400">{emptyText}</p>;
  }

  return (
    <ul className="flex flex-col divide-y divide-neutral-900">
      {users.map((user) => (
        <li key={user.id}>
          <Link href={`/users/${user.username}`} className="flex items-center gap-3 py-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-800 text-sm font-medium">
              {user.name.charAt(0).toUpperCase()}
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-medium">{user.name}</span>
              <span className="truncate text-xs text-neutral-400">@{user.username}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
