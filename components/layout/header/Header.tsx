"use client";

import { signOut } from "next-auth/react";
import { Bell, LogOut, Search } from "lucide-react";

type CurrentUser = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
};

type HeaderProps = {
  user: CurrentUser | null;
};

function getUserInitials(name: string | null, email: string | null) {
  const source = name?.trim() || email?.trim() || "User";

  const words = source
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

export function Header({ user }: HeaderProps) {
  const displayName = user?.name || "User";
  const displayEmail = user?.email || "No email available";
  const initials = getUserInitials(user?.name ?? null, user?.email ?? null);

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-6">
      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative hidden w-80 md:block">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

          <input
            type="search"
            placeholder="Search anything..."
            className="h-10 w-full rounded-lg border bg-muted/30 pl-9 pr-20 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />

          <div className="absolute right-2 top-1/2 -translate-y-1/2 rounded border bg-background px-2 py-0.5 text-[11px] text-muted-foreground">
            ⌘ K
          </div>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button
          type="button"
          aria-label="Notifications"
          className="relative inline-flex size-10 items-center justify-center rounded-lg transition hover:bg-muted"
        >
          <Bell className="size-5 text-muted-foreground" />

          <span className="absolute right-2 top-2 size-2 rounded-full bg-primary" />
        </button>

        {/* User */}
        <div className="hidden items-center gap-3 border-l pl-3 sm:flex">
          <div className="flex size-9 items-center justify-center overflow-hidden rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            {user?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.image}
                alt={displayName}
                className="size-full object-cover"
              />
            ) : (
              initials
            )}
          </div>

          <div className="hidden max-w-48 leading-tight lg:block">
            <p className="truncate text-sm font-medium">{displayName}</p>

            <p className="truncate text-xs text-muted-foreground">
              {displayEmail}
            </p>
          </div>
        </div>

        {/* Sign Out */}
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="inline-flex h-10 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition hover:bg-muted"
        >
          <LogOut className="size-4" />

          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>
    </header>
  );
}