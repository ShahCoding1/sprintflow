"use client";

import {
  Bell,
  Command,
  Search,
} from "lucide-react";

export function Header() {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b bg-background px-6">
      {/* Search */}
      <button
        type="button"
        className="flex h-9 w-full max-w-md items-center gap-3 rounded-lg border bg-muted/30 px-3 text-sm text-muted-foreground transition-colors hover:bg-muted/60"
      >
        <Search className="size-4 shrink-0" />

        <span className="flex-1 text-left">
          Search anything...
        </span>

        <span className="hidden items-center gap-1 rounded border bg-background px-1.5 py-0.5 text-[10px] font-medium sm:flex">
          <Command className="size-3" />
          K
        </span>
      </button>

      {/* Actions */}
      <div className="ml-4 flex items-center gap-2">
        {/* Notifications */}
        <button
          type="button"
          aria-label="Notifications"
          className="relative flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Bell className="size-4" />

          <span className="absolute right-2 top-2 size-1.5 rounded-full bg-primary" />
        </button>

        {/* User */}
        <button
          type="button"
          className="flex items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-muted"
        >
          <div className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
            SH
          </div>

          <div className="hidden text-left md:block">
            <p className="text-sm font-medium leading-none">
              User
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              Member
            </p>
          </div>
        </button>
      </div>
    </header>
  );
}