"use client";

import {
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type Team = {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  _count: {
    members: number;
  };
};

type Member = {
  id: string;
  userId: string;
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
  userId: string;
  role: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
};

export default function TeamManagement() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] =
    useState<Team | null>(null);

  const [members, setMembers] = useState<Member[]>([]);
  const [workspaceMembers, setWorkspaceMembers] =
    useState<WorkspaceMember[]>([]);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [showCreate, setShowCreate] = useState(false);

  const [error, setError] =
    useState<string | null>(null);
  const [message, setMessage] =
    useState<string | null>(null);

  const loadTeams = useCallback(
    async (silent = false) => {
      try {
        if (silent) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError(null);

        const response = await fetch("/api/teams", {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ?? "Unable to load teams.",
          );
        }

        setTeams(data.teams);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load teams.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  const loadTeam = useCallback(
    async (teamId: string) => {
      try {
        setError(null);

        const [
          teamResponse,
          memberResponse,
          workspaceResponse,
        ] = await Promise.all([
          fetch(`/api/teams/${teamId}`, {
            cache: "no-store",
          }),
          fetch(`/api/teams/${teamId}/members`, {
            cache: "no-store",
          }),
          fetch("/api/workspaces/members", {
            cache: "no-store",
          }),
        ]);

        const teamData = await teamResponse.json();
        const memberData =
          await memberResponse.json();
        const workspaceData =
          await workspaceResponse.json();

        if (!teamResponse.ok) {
          throw new Error(
            teamData.message ??
              "Unable to load team.",
          );
        }

        if (!memberResponse.ok) {
          throw new Error(
            memberData.message ??
              "Unable to load team members.",
          );
        }

        if (!workspaceResponse.ok) {
          throw new Error(
            workspaceData.message ??
              "Unable to load workspace members.",
          );
        }

        const team = teamData.team as Team;

        setSelectedTeam(team);
        setMembers(memberData.members);
        setWorkspaceMembers(
          workspaceData.members,
        );

        setName(team.name);
        setDescription(team.description ?? "");
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load team.",
        );
      }
    },
    [],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadTeams();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadTeams]);

  const createTeam = async () => {
    const trimmedName = name.trim();

    if (trimmedName.length < 2) {
      setError(
        "Team name must contain at least 2 characters.",
      );
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setMessage(null);

      const response = await fetch("/api/teams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: trimmedName,
          description:
            description.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ??
            "Unable to create team.",
        );
      }

      setTeams((current) =>
        [...current, data.team].sort((a, b) =>
          a.name.localeCompare(b.name),
        ),
      );

      setShowCreate(false);
      setName("");
      setDescription("");

      setMessage(
        "Team created successfully.",
      );

      await loadTeam(data.team.id);
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Unable to create team.",
      );
    } finally {
      setSaving(false);
    }
  };

  const updateTeam = async () => {
    if (!selectedTeam) {
      return;
    }

    const trimmedName = name.trim();

    if (trimmedName.length < 2) {
      setError(
        "Team name must contain at least 2 characters.",
      );
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setMessage(null);

      const response = await fetch(
        `/api/teams/${selectedTeam.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: trimmedName,
            description:
              description.trim() || null,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ??
            "Unable to update team.",
        );
      }

      const updatedTeam =
        data.team as Team;

      setSelectedTeam(updatedTeam);

      setTeams((current) =>
        current
          .map((team) =>
            team.id === updatedTeam.id
              ? updatedTeam
              : team,
          )
          .sort((a, b) =>
            a.name.localeCompare(b.name),
          ),
      );

      setMessage(
        "Team updated successfully.",
      );
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Unable to update team.",
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteTeam = async () => {
    if (!selectedTeam) {
      return;
    }

    const confirmed = window.confirm(
      `Delete the "${selectedTeam.name}" team?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setError(null);
      setMessage(null);

      const response = await fetch(
        `/api/teams/${selectedTeam.id}`,
        {
          method: "DELETE",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ??
            "Unable to delete team.",
        );
      }

      const deletedTeamId =
        selectedTeam.id;

      setTeams((current) =>
        current.filter(
          (team) =>
            team.id !== deletedTeamId,
        ),
      );

      setSelectedTeam(null);
      setMembers([]);
      setWorkspaceMembers([]);
      setName("");
      setDescription("");

      setMessage(
        "Team deleted successfully.",
      );
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete team.",
      );
    }
  };

  const addMember = async (
    userId: string,
  ) => {
    if (!selectedTeam || !userId) {
      return;
    }

    if (
      members.some(
        (member) =>
          member.userId === userId,
      )
    ) {
      setError(
        "This user is already a member of the team.",
      );
      return;
    }

    try {
      setError(null);
      setMessage(null);

      const response = await fetch(
        `/api/teams/${selectedTeam.id}/members`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ??
            "Unable to add team member.",
        );
      }

      const addedMember =
        data.member as Member;

      setMembers((current) => [
        ...current,
        addedMember,
      ]);

      setTeams((current) =>
        current.map((team) =>
          team.id === selectedTeam.id
            ? {
                ...team,
                _count: {
                  members:
                    team._count.members + 1,
                },
              }
            : team,
        ),
      );

      setSelectedTeam((current) =>
        current
          ? {
              ...current,
              _count: {
                members:
                  current._count.members + 1,
              },
            }
          : current,
      );

      setMessage(
        "Member added to the team.",
      );
    } catch (addError) {
      setError(
        addError instanceof Error
          ? addError.message
          : "Unable to add team member.",
      );
    }
  };

  const removeMember = async (
    userId: string,
  ) => {
    if (!selectedTeam) {
      return;
    }

    const confirmed = window.confirm(
      "Remove this member from the team?",
    );

    if (!confirmed) {
      return;
    }

    try {
      setError(null);
      setMessage(null);

      const response = await fetch(
        `/api/teams/${selectedTeam.id}/members/${userId}`,
        {
          method: "DELETE",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ??
            "Unable to remove team member.",
        );
      }

      setMembers((current) =>
        current.filter(
          (member) =>
            member.userId !== userId,
        ),
      );

      setTeams((current) =>
        current.map((team) =>
          team.id === selectedTeam.id
            ? {
                ...team,
                _count: {
                  members: Math.max(
                    0,
                    team._count.members - 1,
                  ),
                },
              }
            : team,
        ),
      );

      setSelectedTeam((current) =>
        current
          ? {
              ...current,
              _count: {
                members: Math.max(
                  0,
                  current._count.members - 1,
                ),
              },
            }
          : current,
      );

      setMessage(
        "Member removed from the team.",
      );
    } catch (removeError) {
      setError(
        removeError instanceof Error
          ? removeError.message
          : "Unable to remove team member.",
      );
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading teams...
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">
            Workspace teams
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            Teams
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Organize workspace members into focused
            development teams.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() =>
              void loadTeams(true)
            }
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
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

          <button
            type="button"
            onClick={() => {
              setName("");
              setDescription("");
              setError(null);
              setShowCreate(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Plus className="size-4" />
            New Team
          </button>
        </div>
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
          className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary"
        >
          {message}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <section className="rounded-2xl border bg-card shadow-sm">
          <div className="border-b p-5">
            <h2 className="font-semibold">
              Your teams
            </h2>

            <p className="mt-1 text-xs text-muted-foreground">
              {teams.length} team
              {teams.length === 1 ? "" : "s"}
            </p>
          </div>

          <div className="max-h-[600px] overflow-y-auto p-3">
            {teams.length === 0 ? (
              <div className="rounded-xl border border-dashed p-6 text-center">
                <Users className="mx-auto size-8 text-muted-foreground" />

                <p className="mt-3 text-sm font-medium">
                  No teams yet
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Create your first workspace team.
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {teams.map((team) => (
                  <button
                    key={team.id}
                    type="button"
                    onClick={() =>
                      void loadTeam(team.id)
                    }
                    className={`w-full rounded-xl p-3 text-left transition-colors ${
                      selectedTeam?.id === team.id
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <Users className="size-4" />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {team.name}
                        </p>

                        <p className="text-xs text-muted-foreground">
                          {team._count.members} member
                          {team._count.members === 1
                            ? ""
                            : "s"}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="min-w-0 rounded-2xl border bg-card shadow-sm">
          {!selectedTeam ? (
            <div className="flex min-h-[500px] flex-col items-center justify-center p-8 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-muted">
                <Users className="size-7 text-muted-foreground" />
              </div>

              <h2 className="mt-4 text-lg font-semibold">
                Select a team
              </h2>

              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                Choose a team from the list to manage
                its details and members.
              </p>
            </div>
          ) : (
            <div>
              <div className="border-b p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h2 className="break-words text-xl font-bold">
                      {selectedTeam.name}
                    </h2>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {members.length} member
                      {members.length === 1
                        ? ""
                        : "s"}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      void deleteTeam()
                    }
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-destructive/30 px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/5"
                  >
                    <Trash2 className="size-4" />
                    Delete
                  </button>
                </div>
              </div>

              <div className="space-y-6 p-5 sm:p-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm font-medium">
                      Team name
                    </span>

                    <input
                      value={name}
                      onChange={(event) =>
                        setName(
                          event.target.value,
                        )
                      }
                      className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary"
                    />
                  </label>

                  <label className="space-y-2 sm:col-span-2">
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
                      rows={3}
                      maxLength={500}
                      className="w-full resize-y rounded-lg border bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary"
                    />

                    <span className="block text-right text-xs text-muted-foreground">
                      {description.length}/500
                    </span>
                  </label>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() =>
                      void updateTeam()
                    }
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Save className="size-4" />
                    )}
                    Save Team
                  </button>
                </div>

                <div className="border-t pt-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <h3 className="font-semibold">
                        Team members
                      </h3>

                      <p className="mt-1 text-xs text-muted-foreground">
                        Add or remove workspace members
                        from this team.
                      </p>
                    </div>

                    <div className="flex min-w-0 gap-2">
                      <select
                        defaultValue=""
                        onChange={(event) => {
                          const userId =
                            event.target.value;

                          if (userId) {
                            void addMember(userId);
                            event.target.value = "";
                          }
                        }}
                        className="min-w-0 flex-1 rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary sm:w-64"
                      >
                        <option value="">
                          Add workspace member...
                        </option>

                        {workspaceMembers
                          .filter(
                            (workspaceMember) =>
                              !members.some(
                                (member) =>
                                  member.userId ===
                                  workspaceMember.userId,
                              ),
                          )
                          .map(
                            (workspaceMember) => (
                              <option
                                key={
                                  workspaceMember.userId
                                }
                                value={
                                  workspaceMember.userId
                                }
                              >
                                {workspaceMember.user.name ??
                                  workspaceMember.user.email}
                              </option>
                            ),
                          )}
                      </select>

                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <UserPlus className="size-4" />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 divide-y rounded-xl border">
                    {members.map((member) => {
                      const displayName =
                        member.user.name ??
                        member.user.email;

                      const initial =
                        displayName
                          .charAt(0)
                          .toUpperCase();

                      return (
                        <div
                          key={member.id}
                          className="flex items-center justify-between gap-3 p-4"
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
                                  ? `${displayName} avatar`
                                  : undefined
                              }
                              className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted bg-cover bg-center text-xs font-semibold"
                              style={
                                member.user.image
                                  ? {
                                      backgroundImage: `url("${member.user.image}")`,
                                    }
                                  : undefined
                              }
                            >
                              {!member.user.image &&
                                initial}
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">
                                {member.user.name ??
                                  "Unnamed user"}
                              </p>

                              <p className="truncate text-xs text-muted-foreground">
                                {member.user.email}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              void removeMember(
                                member.userId,
                              )
                            }
                            className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-destructive/30 px-3 py-2 text-xs font-medium text-destructive transition-colors hover:bg-destructive/5"
                          >
                            <X className="size-3.5" />
                            <span className="hidden sm:inline">
                              Remove
                            </span>
                          </button>
                        </div>
                      );
                    })}

                    {members.length === 0 && (
                      <div className="p-8 text-center text-sm text-muted-foreground">
                        This team has no members yet.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      {showCreate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-team-title"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget
            ) {
              setShowCreate(false);
            }
          }}
        >
          <div className="w-full max-w-lg rounded-2xl border bg-card p-5 shadow-xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="create-team-title"
                  className="text-lg font-semibold"
                >
                  Create team
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  Create a focused team inside the
                  current workspace.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowCreate(false)
                }
                aria-label="Close create team dialog"
                className="rounded-lg p-2 transition-colors hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <label className="space-y-2">
                <span className="text-sm font-medium">
                  Team name
                </span>

                <input
                  autoFocus
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  placeholder="Frontend Team"
                  className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                />
              </label>

              <label className="space-y-2">
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
                  rows={4}
                  maxLength={500}
                  placeholder="What does this team own?"
                  className="w-full resize-y rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                />
              </label>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() =>
                  setShowCreate(false)
                }
                className="rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() =>
                  void createTeam()
                }
                disabled={
                  saving ||
                  name.trim().length < 2
                }
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving && (
                  <Loader2 className="size-4 animate-spin" />
                )}
                Create Team
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}