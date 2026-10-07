"use client";

import { signOut } from "next-auth/react";
import {
  Command,
  LogOut,
  Search,
} from "lucide-react";
import { useEffect, useState } from "react";

import CommandPalette from "@/components/search/CommandPalette";
import NotificationBell from "@/components/notifications/NotificationBell";

type CurrentUser = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
};

type HeaderProps = {
  user: CurrentUser | null;
};

function getUserInitials(
  name: string | null,
  email: string | null,
) {
  const source =
    name?.trim() ||
    email?.trim() ||
    "User";

  const words = source
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 1) {
    return words[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

export function Header({
  user,
}: HeaderProps) {
  const [isSearchOpen, setIsSearchOpen] =
    useState(false);

  const displayName =
    user?.name || "User";

  const displayEmail =
    user?.email ||
    "No email available";

  const initials = getUserInitials(
    user?.name ?? null,
    user?.email ?? null,
  );

  useEffect(() => {
    function handleGlobalShortcut(
      event: KeyboardEvent,
    ) {
      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault();
        setIsSearchOpen(true);
      }
    }

    window.addEventListener(
      "keydown",
      handleGlobalShortcut,
    );

    return () =>
      window.removeEventListener(
        "keydown",
        handleGlobalShortcut,
      );
  }, []);

  return (
    <>
      <header className="flex min-h-16 items-center justify-between border-b bg-background px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={() =>
              setIsSearchOpen(true)
            }
            className="hidden h-10 w-80 items-center gap-3 rounded-lg border bg-muted/30 px-3 text-left text-sm text-muted-foreground transition hover:bg-muted md:flex"
            aria-label="Open global search"
          >
            <Search className="size-4 shrink-0" />

            <span className="min-w-0 flex-1 truncate">
              Search anything...
            </span>

            <span className="inline-flex shrink-0 items-center gap-1 rounded border bg-background px-2 py-0.5 text-[11px]">
              <Command className="size-3" />
              K
            </span>
          </button>

          <button
            type="button"
            onClick={() =>
              setIsSearchOpen(true)
            }
            className="inline-flex size-10 items-center justify-center rounded-lg border transition hover:bg-muted md:hidden"
            aria-label="Open global search"
          >
            <Search className="size-4" />
          </button>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <NotificationBell />

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
              <p className="truncate text-sm font-medium">
                {displayName}
              </p>

              <p className="truncate text-xs text-muted-foreground">
                {displayEmail}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              signOut({
                callbackUrl: "/login",
              })
            }
            className="inline-flex h-10 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition hover:bg-muted"
          >
            <LogOut className="size-4" />

            <span className="hidden sm:inline">
              Sign out
            </span>
          </button>
        </div>
      </header>

      <CommandPalette
        open={isSearchOpen}
        onClose={() =>
          setIsSearchOpen(false)
        }
      />
    </>
  );
}