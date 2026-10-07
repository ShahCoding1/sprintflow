"use client";

import {
  Check,
  Loader2,
  RefreshCw,
  Save,
  Shield,
  Trash2,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type Workspace = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  _count: {
    members: number;
    projects: number;
    teams: number;
  };
};

type WorkspaceRole =
  | "OWNER"
  | "ADMIN"
  | "MEMBER"
  | "VIEWER";

type Member = {
  id: string;
  userId: string;
  role: WorkspaceRole;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
};

const roleDescriptions: Record<
  WorkspaceRole,
  string
> = {
  OWNER: "Full control over the workspace.",
  ADMIN: "Manage workspace settings and members.",
  MEMBER: "Standard workspace access.",
  VIEWER: "Read-only workspace access.",
};

export default function WorkspaceSettings() {
  const [workspace, setWorkspace] =
    useState<Workspace | null>(null);

  const [members, setMembers] = useState<Member[]>(
    [],
  );

  const [viewerRole, setViewerRole] =
    useState<WorkspaceRole | null>(null);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [message, setMessage] =
    useState<string | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  const canManage =
    viewerRole === "OWNER" ||
    viewerRole === "ADMIN";

  const canAssignOwner = viewerRole === "OWNER";

  const loadSettings = useCallback(
    async (silent = false) => {
      try {
        if (silent) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError(null);

        const [
          workspaceResponse,
          membersResponse,
        ] = await Promise.all([
          fetch("/api/workspaces/settings", {
            cache: "no-store",
          }),
          fetch(
            "/api/workspaces/settings/members",
            {
              cache: "no-store",
            },
          ),
        ]);

        const workspaceData =
          await workspaceResponse.json();

        const membersData =
          await membersResponse.json();

        if (!workspaceResponse.ok) {
          throw new Error(
            workspaceData.message ??
              "Unable to load workspace.",
          );
        }

        if (!membersResponse.ok) {
          throw new Error(
            membersData.message ??
              "Unable to load workspace members.",
          );
        }

        const loadedWorkspace =
          workspaceData.workspace as Workspace;

        setWorkspace(loadedWorkspace);
        setName(loadedWorkspace.name);
        setSlug(loadedWorkspace.slug);
        setDescription(
          loadedWorkspace.description ?? "",
        );

        setMembers(
          membersData.members as Member[],
        );

        setViewerRole(
          membersData.viewerRole as WorkspaceRole,
        );
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load workspace settings.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  /*
   * The initial request is scheduled through a timer.
   * This avoids synchronously triggering React state
   * updates from the effect body.
   */
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadSettings();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadSettings]);

  const sortedMembers = useMemo(
    () =>
      [...members].sort((a, b) =>
        a.user.email.localeCompare(
          b.user.email,
        ),
      ),
    [members],
  );

  const handleSave = async () => {
    if (!canManage) {
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setMessage(null);

      const response = await fetch(
        "/api/workspaces/settings",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            slug,
            description:
              description.trim() || null,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ??
            "Unable to save workspace settings.",
        );
      }

      setWorkspace(data.workspace);
      setName(data.workspace.name);
      setSlug(data.workspace.slug);
      setDescription(
        data.workspace.description ?? "",
      );

      setMessage(
        "Workspace settings saved successfully.",
      );
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save workspace settings.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleRoleChange = async (
    member: Member,
    role: WorkspaceRole,
  ) => {
    if (!canManage || member.role === "OWNER") {
      return;
    }

    if (
      role === "OWNER" &&
      !canAssignOwner
    ) {
      return;
    }

    try {
      setError(null);
      setMessage(null);

      const response = await fetch(
        `/api/workspaces/settings/members/${member.userId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            role,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ??
            "Unable to update member role.",
        );
      }

      setMembers((current) =>
        current.map((item) =>
          item.userId === member.userId
            ? {
                ...item,
                role: data.member.role,
              }
            : item,
        ),
      );

      setMessage(
        "Member role updated successfully.",
      );
    } catch (roleError) {
      setError(
        roleError instanceof Error
          ? roleError.message
          : "Unable to update member role.",
      );
    }
  };

  const handleRemove = async (
    member: Member,
  ) => {
    if (!canManage || member.role === "OWNER") {
      return;
    }

    const confirmed = window.confirm(
      `Remove ${
        member.user.name ?? member.user.email
      } from this workspace?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setError(null);
      setMessage(null);

      const response = await fetch(
        `/api/workspaces/settings/members/${member.userId}`,
        {
          method: "DELETE",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ??
            "Unable to remove member.",
        );
      }

      setMembers((current) =>
        current.filter(
          (item) =>
            item.userId !== member.userId,
        ),
      );

      setMessage(
        "Member removed from the workspace.",
      );
    } catch (removeError) {
      setError(
        removeError instanceof Error
          ? removeError.message
          : "Unable to remove member.",
      );
    }
  };

  if (loading) {
    return (
      <section className="rounded-2xl border bg-card p-8 shadow-sm">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading workspace settings...
        </div>
      </section>
    );
  }

  if (!workspace) {
    return (
      <section className="rounded-2xl border bg-card p-8 shadow-sm">
        <p className="text-sm text-destructive">
          {error ??
            "Workspace settings are unavailable."}
        </p>
      </section>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-sm sm:p-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-primary">
            Workspace administration
          </p>

          <h1 className="mt-1 break-words text-2xl font-bold tracking-tight sm:text-3xl">
            {workspace.name}
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Manage workspace identity, members,
            roles, and access controls.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadSettings(true)}
          disabled={refreshing}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            className={
              refreshing
                ? "size-4 animate-spin"
                : "size-4"
            }
          />
          Refresh
        </button>
      </header>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      {message && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary"
        >
          <Check className="size-4 shrink-0" />
          {message}
        </div>
      )}

      <section className="rounded-2xl border bg-card shadow-sm">
        <div className="border-b p-5 sm:p-6">
          <h2 className="text-lg font-semibold">
            General settings
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Configure the workspace identity and
            public slug.
          </p>
        </div>

        <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium">
              Workspace name
            </span>

            <input
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              disabled={!canManage || saving}
              className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary disabled:cursor-not-allowed disabled:opacity-60"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">
              Workspace slug
            </span>

            <input
              value={slug}
              onChange={(event) =>
                setSlug(
                  event.target.value
                    .toLowerCase()
                    .replace(/\s+/g, "-"),
                )
              }
              disabled={!canManage || saving}
              className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary disabled:cursor-not-allowed disabled:opacity-60"
            />
          </label>

          <label className="space-y-2 lg:col-span-2">
            <span className="text-sm font-medium">
              Description
            </span>

            <textarea
              value={description}
              onChange={(event) =>
                setDescription(
                  event.target.value,
                )
              }
              disabled={!canManage || saving}
              rows={4}
              maxLength={500}
              className="w-full resize-y rounded-lg border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary disabled:cursor-not-allowed disabled:opacity-60"
            />

            <span className="block text-right text-xs text-muted-foreground">
              {description.length}/500
            </span>
          </label>
        </div>

        <div className="flex justify-end border-t p-5 sm:p-6">
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={!canManage || saving}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            Save changes
          </button>
        </div>
      </section>

      <section className="rounded-2xl border bg-card shadow-sm">
        <div className="border-b p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
              <Users className="size-5" />
            </div>

            <div>
              <h2 className="text-lg font-semibold">
                Workspace members
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                {members.length} member
                {members.length === 1 ? "" : "s"} ·
                Your role:{" "}
                <span className="font-medium text-foreground">
                  {viewerRole}
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="divide-y">
          {sortedMembers.map((member) => {
            const isOwner =
              member.role === "OWNER";

            const initials = (
              member.user.name ??
              member.user.email
            )
              .trim()
              .charAt(0)
              .toUpperCase();

            return (
              <div
                key={member.id}
                className="flex flex-col gap-4 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    role={
                      member.user.image
                        ? "img"
                        : undefined
                    }
                    aria-label={
                      member.user.image
                        ? `${
                            member.user.name ??
                            member.user.email
                          } avatar`
                        : undefined
                    }
                    className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted bg-cover bg-center text-sm font-semibold"
                    style={
                      member.user.image
                        ? {
                            backgroundImage: `url("${member.user.image}")`,
                          }
                        : undefined
                    }
                  >
                    {!member.user.image &&
                      initials}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {member.user.name ??
                        "Unnamed user"}
                    </p>

                    <p className="truncate text-sm text-muted-foreground">
                      {member.user.email}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <select
                    value={member.role}
                    disabled={
                      !canManage || isOwner
                    }
                    onChange={(event) =>
                      void handleRoleChange(
                        member,
                        event.target
                          .value as WorkspaceRole,
                      )
                    }
                    className="rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {canAssignOwner && (
                      <option value="OWNER">
                        OWNER
                      </option>
                    )}

                    <option value="ADMIN">
                      ADMIN
                    </option>

                    <option value="MEMBER">
                      MEMBER
                    </option>

                    <option value="VIEWER">
                      VIEWER
                    </option>
                  </select>

                  <div className="hidden min-w-52 text-xs text-muted-foreground lg:block">
                    {roleDescriptions[
                      member.role
                    ]}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      void handleRemove(member)
                    }
                    disabled={
                      !canManage || isOwner
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-destructive/30 px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/5 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Trash2 className="size-4" />
                    Remove
                  </button>
                </div>
              </div>
            );
          })}

          {sortedMembers.length === 0 && (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No workspace members found.
            </div>
          )}
        </div>
      </section>

      <section className="rounded-2xl border bg-card shadow-sm">
        <div className="flex items-start gap-3 p-5 sm:p-6">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
            <Shield className="size-5" />
          </div>

          <div className="min-w-0">
            <h2 className="text-lg font-semibold">
              Role permissions
            </h2>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {(
                Object.keys(
                  roleDescriptions,
                ) as WorkspaceRole[]
              ).map((role) => (
                <div
                  key={role}
                  className="rounded-xl border p-4"
                >
                  <p className="text-sm font-semibold">
                    {role}
                  </p>

                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {roleDescriptions[role]}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-destructive/20 bg-destructive/[0.02] p-5 sm:p-6">
        <h2 className="text-lg font-semibold">
          Workspace protection
        </h2>

        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          The workspace owner is protected from
          role changes and removal. Server-side
          authorization is enforced independently of
          this interface.
        </p>
      </section>
    </div>
  );
}