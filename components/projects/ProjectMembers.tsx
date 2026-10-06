"use client";

import {
  ChevronDown,
  Loader2,
  Plus,
  Shield,
  Trash2,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

type ProjectRole = "MANAGER" | "MEMBER" | "VIEWER";

type ProjectMember = {
  id: string;
  projectId: string;
  userId: string;
  role: ProjectRole;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
};

type WorkspaceMember = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  organizationRole: string;
};

type ProjectMembersProps = {
  projectId: string;
  onCountChange?: (count: number) => void;
};


const roleClasses: Record<ProjectRole, string> = {
  MANAGER:
    "bg-primary/10 text-primary ring-primary/20",
  MEMBER:
    "bg-muted text-foreground ring-border",
  VIEWER:
    "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400",
};

export default function ProjectMembers({
  projectId,
  onCountChange,
}: ProjectMembersProps) {
  const [members, setMembers] = useState<ProjectMember[]>(
    [],
  );

  const [workspaceMembers, setWorkspaceMembers] =
    useState<WorkspaceMember[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isWorkspaceLoading, setIsWorkspaceLoading] =
    useState(false);
  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [selectedUserId, setSelectedUserId] =
    useState("");
  const [selectedRole, setSelectedRole] =
    useState<ProjectRole>("MEMBER");

  const [error, setError] = useState<string | null>(
    null,
  );

  const [actionError, setActionError] =
    useState<string | null>(null);

  const [removingUserId, setRemovingUserId] =
    useState<string | null>(null);

  const [updatingUserId, setUpdatingUserId] =
    useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadMembers() {
      try {
        const response = await fetch(
          `/api/projects/${projectId}/members`,
          {
            method: "GET",
            cache: "no-store",
          },
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message ??
              "Unable to load project members.",
          );
        }

        if (!cancelled) {
          const loadedMembers =
            result.members as ProjectMember[];

          setMembers(loadedMembers);
          onCountChange?.(loadedMembers.length);
          setIsLoading(false);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load project members.",
          );
          setIsLoading(false);
        }
      }
    }

    void loadMembers();

    return () => {
      cancelled = true;
    };
  }, [projectId, onCountChange]);

  async function openAddMemberDialog() {
    try {
      setActionError(null);
      setIsWorkspaceLoading(true);

      const response = await fetch(
        "/api/workspaces/members",
        {
          method: "GET",
          cache: "no-store",
        },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ??
            "Unable to load workspace members.",
        );
      }

      setWorkspaceMembers(result.members);
      setSelectedUserId("");
      setSelectedRole("MEMBER");
      setIsDialogOpen(true);
    } catch (loadError) {
      setActionError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load workspace members.",
      );
    } finally {
      setIsWorkspaceLoading(false);
    }
  }

  async function handleAddMember() {
    if (!selectedUserId) {
      setActionError(
        "Please select a workspace member.",
      );
      return;
    }

    try {
      setIsSubmitting(true);
      setActionError(null);

      const response = await fetch(
        `/api/projects/${projectId}/members`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: selectedUserId,
            role: selectedRole,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ??
            "Unable to add project member.",
        );
      }

      const addedMember =
        result.member as ProjectMember;

      setMembers((current) => {
        const updatedMembers = [
          ...current,
          addedMember,
        ];

        onCountChange?.(updatedMembers.length);

        return updatedMembers;
      });

      setIsDialogOpen(false);
      setSelectedUserId("");
      setSelectedRole("MEMBER");
    } catch (addError) {
      setActionError(
        addError instanceof Error
          ? addError.message
          : "Unable to add project member.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRoleChange(
    userId: string,
    role: ProjectRole,
  ) {
    const member = members.find(
      (item) => item.userId === userId,
    );

    if (!member || member.role === role) {
      return;
    }

    try {
      setUpdatingUserId(userId);
      setActionError(null);

      const response = await fetch(
        `/api/projects/${projectId}/members/${userId}`,
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

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ??
            "Unable to update project member role.",
        );
      }

      const updatedMember =
        result.member as ProjectMember;

      setMembers((current) =>
        current.map((item) =>
          item.userId === userId
            ? updatedMember
            : item,
        ),
      );
    } catch (roleError) {
      setActionError(
        roleError instanceof Error
          ? roleError.message
          : "Unable to update project member role.",
      );
    } finally {
      setUpdatingUserId(null);
    }
  }

  async function handleRemove(userId: string) {
    const member = members.find(
      (item) => item.userId === userId,
    );

    if (!member) {
      return;
    }

    const displayName =
      member.user.name || member.user.email;

    const confirmed = window.confirm(
      `Remove ${displayName} from this project?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setRemovingUserId(userId);
      setActionError(null);

      const response = await fetch(
        `/api/projects/${projectId}/members/${userId}`,
        {
          method: "DELETE",
        },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ??
            "Unable to remove project member.",
        );
      }

      setMembers((current) => {
        const updatedMembers = current.filter(
          (item) => item.userId !== userId,
        );

        onCountChange?.(updatedMembers.length);

        return updatedMembers;
      });
    } catch (removeError) {
      setActionError(
        removeError instanceof Error
          ? removeError.message
          : "Unable to remove project member.",
      );
    } finally {
      setRemovingUserId(null);
    }
  }

  const availableMembers =
    workspaceMembers.filter(
      (workspaceMember) =>
        !members.some(
          (projectMember) =>
            projectMember.userId ===
            workspaceMember.id,
        ),
    );

  return (
    <>
      <section className="rounded-2xl border bg-card shadow-sm">
        <div className="flex flex-col gap-4 border-b px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>

              <div className="min-w-0">
                <h2 className="text-lg font-semibold">
                  Project members
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  Manage the people working on this project.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              void openAddMemberDialog()
            }
            disabled={isWorkspaceLoading}
            className="inline-flex h-10 w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-60 sm:w-auto"
          >
            {isWorkspaceLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}

            Add member
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="mx-5 mt-5 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive sm:mx-6"
          >
            {error}
          </div>
        )}

        {actionError && (
          <div
            role="alert"
            className="mx-5 mt-5 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive sm:mx-6"
          >
            {actionError}
          </div>
        )}

        <div className="p-5 sm:p-6">
          {isLoading ? (
            <div className="flex min-h-32 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : members.length === 0 ? (
            <div className="flex min-h-32 flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 px-6 py-8 text-center">
              <UserRound className="h-8 w-8 text-muted-foreground" />

              <p className="mt-3 text-sm font-medium">
                No project members yet
              </p>

              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Add workspace members to start
                collaborating on this project.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {members.map((member) => {
                const displayName =
                  member.user.name ||
                  member.user.email;

                const initials = (
                  member.user.name ||
                  member.user.email
                )
                  .split(/\s+/)
                  .map((part) =>
                    part.charAt(0),
                  )
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();

                const isRemoving =
                  removingUserId === member.userId;

                const isUpdating =
                  updatingUserId === member.userId;

                return (
                  <div
                    key={member.id}
                    className="flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                        {initials}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {displayName}
                        </p>

                        {member.user.name && (
                          <p className="truncate text-xs text-muted-foreground">
                            {member.user.email}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                      <div className="relative">
                        <select
                          value={member.role}
                          disabled={
                            isUpdating ||
                            isRemoving
                          }
                          onChange={(event) =>
                            void handleRoleChange(
                              member.userId,
                              event.target
                                .value as ProjectRole,
                            )
                          }
                          aria-label={`Change role for ${displayName}`}
                          className={`h-9 appearance-none rounded-full py-0 pl-3 pr-8 text-xs font-medium ring-1 ring-inset outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${roleClasses[member.role]}`}
                        >
                          <option value="MANAGER">
                            Manager
                          </option>

                          <option value="MEMBER">
                            Member
                          </option>

                          <option value="VIEWER">
                            Viewer
                          </option>
                        </select>

                        <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
                          {isUpdating ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5" />
                          )}
                        </div>
                      </div>

                      {member.role === "MANAGER" && (
                        <Shield className="hidden h-4 w-4 text-primary sm:block" />
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          void handleRemove(
                            member.userId,
                          )
                        }
                        disabled={
                          isRemoving ||
                          isUpdating
                        }
                        aria-label={`Remove ${displayName}`}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:pointer-events-none disabled:opacity-50"
                      >
                        {isRemoving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {isDialogOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget
            ) {
              setIsDialogOpen(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-member-title"
            className="w-full max-w-md rounded-2xl border bg-background p-5 shadow-xl sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3
                  id="add-member-title"
                  className="text-lg font-semibold"
                >
                  Add project member
                </h3>

                <p className="mt-1 text-sm text-muted-foreground">
                  Select a member from this workspace.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setIsDialogOpen(false)
                }
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Close dialog"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 space-y-5">
              <div>
                <label
                  htmlFor="workspace-member"
                  className="mb-2 block text-sm font-medium"
                >
                  Workspace member
                </label>

                <select
                  id="workspace-member"
                  value={selectedUserId}
                  onChange={(event) =>
                    setSelectedUserId(
                      event.target.value,
                    )
                  }
                  className="h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">
                    Select a member
                  </option>

                  {availableMembers.map(
                    (member) => (
                      <option
                        key={member.id}
                        value={member.id}
                      >
                        {member.name
                          ? `${member.name} — ${member.email}`
                          : member.email}
                      </option>
                    ),
                  )}
                </select>

                {availableMembers.length ===
                  0 && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    All workspace members are
                    already assigned to this
                    project.
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="project-member-role"
                  className="mb-2 block text-sm font-medium"
                >
                  Project role
                </label>

                <select
                  id="project-member-role"
                  value={selectedRole}
                  onChange={(event) =>
                    setSelectedRole(
                      event.target
                        .value as ProjectRole,
                    )
                  }
                  className="h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  <option value="MEMBER">
                    Member
                  </option>

                  <option value="MANAGER">
                    Manager
                  </option>

                  <option value="VIEWER">
                    Viewer
                  </option>
                </select>
              </div>

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() =>
                    setIsDialogOpen(false)
                  }
                  className="inline-flex h-10 items-center justify-center rounded-lg border px-4 text-sm font-medium hover:bg-muted"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() =>
                    void handleAddMember()
                  }
                  disabled={
                    isSubmitting ||
                    !selectedUserId ||
                    availableMembers.length === 0
                  }
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:pointer-events-none disabled:opacity-50"
                >
                  {isSubmitting && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}

                  Add member
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}