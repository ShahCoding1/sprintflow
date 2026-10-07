"use client";

import {
  Check,
  Clipboard,
  Loader2,
  Mail,
  RefreshCw,
  Shield,
  Trash2,
  UserPlus,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type InvitationRole = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";

type InvitationStatus =
  | "PENDING"
  | "ACCEPTED"
  | "REVOKED"
  | "EXPIRED";

type Invitation = {
  id: string;
  organizationId: string;
  inviterId: string;
  email: string;
  role: InvitationRole;
  status: InvitationStatus;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  inviter: {
    id: string;
    name: string | null;
    email: string;
  };
  token?: string;
};

type InvitationsResponse = {
  invitations: Invitation[];
};

type ErrorResponse = {
  error?: string;
};

type CreateInvitationResponse = {
  invitation: Invitation;
};

type RevokeInvitationResponse = {
  invitation: Invitation;
};

const ROLE_LABELS: Record<InvitationRole, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  MEMBER: "Member",
  VIEWER: "Viewer",
};

const STATUS_LABELS: Record<InvitationStatus, string> = {
  PENDING: "Pending",
  ACCEPTED: "Accepted",
  REVOKED: "Revoked",
  EXPIRED: "Expired",
};

function isErrorResponse(
  data: InvitationsResponse | ErrorResponse,
): data is ErrorResponse {
  return !("invitations" in data);
}

function isCreateInvitationResponse(
  data: CreateInvitationResponse | ErrorResponse,
): data is CreateInvitationResponse {
  return "invitation" in data;
}

function isRevokeInvitationResponse(
  data: RevokeInvitationResponse | ErrorResponse,
): data is RevokeInvitationResponse {
  return "invitation" in data;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getStatusClassName(status: InvitationStatus) {
  switch (status) {
    case "PENDING":
      return "bg-amber-500/10 text-amber-700 dark:text-amber-400";

    case "ACCEPTED":
      return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";

    case "REVOKED":
      return "bg-red-500/10 text-red-700 dark:text-red-400";

    case "EXPIRED":
      return "bg-muted text-muted-foreground";
  }
}

export default function InvitationManagement() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<InvitationRole>("MEMBER");

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadInvitations = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/invitations", {
        method: "GET",
        cache: "no-store",
      });

      const data = (await response.json()) as
        | InvitationsResponse
        | ErrorResponse;

      if (!response.ok) {
        throw new Error(
          isErrorResponse(data) && data.error
            ? data.error
            : "Failed to load invitations.",
        );
      }

      if (isErrorResponse(data)) {
        throw new Error("Invalid invitations response.");
      }

      setInvitations(data.invitations);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load invitations.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadInvitations();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadInvitations]);

  const createInvitation = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError("Enter an email address.");
      return;
    }

    try {
      setCreating(true);
      setError("");
      setSuccess("");

      const response = await fetch("/api/invitations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: normalizedEmail,
          role,
        }),
      });

      const data = (await response.json()) as
        | CreateInvitationResponse
        | ErrorResponse;

      if (!response.ok) {
        throw new Error(
          !isCreateInvitationResponse(data) && data.error
            ? data.error
            : "Failed to create invitation.",
        );
      }

      if (!isCreateInvitationResponse(data)) {
        throw new Error("Invalid invitation response.");
      }

      setInvitations((current) => [
        data.invitation,
        ...current,
      ]);

      setEmail("");
      setRole("MEMBER");
      setSuccess(
        `Invitation created for ${normalizedEmail}.`,
      );
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Failed to create invitation.",
      );
    } finally {
      setCreating(false);
    }
  };

  const revokeInvitation = async (
    invitationId: string,
  ) => {
    try {
      setRevokingId(invitationId);
      setError("");
      setSuccess("");

      const response = await fetch(
        `/api/invitations/${invitationId}`,
        {
          method: "DELETE",
        },
      );

      const data = (await response.json()) as
        | RevokeInvitationResponse
        | ErrorResponse;

      if (!response.ok) {
        throw new Error(
          !isRevokeInvitationResponse(data) && data.error
            ? data.error
            : "Failed to revoke invitation.",
        );
      }

      if (!isRevokeInvitationResponse(data)) {
        throw new Error(
          "Invalid invitation response.",
        );
      }

      setInvitations((current) =>
        current.map((invitation) =>
          invitation.id === invitationId
            ? {
                ...invitation,
                status: data.invitation.status,
                updatedAt: data.invitation.updatedAt,
              }
            : invitation,
        ),
      );

      setSuccess("Invitation revoked successfully.");
    } catch (revokeError) {
      setError(
        revokeError instanceof Error
          ? revokeError.message
          : "Failed to revoke invitation.",
      );
    } finally {
      setRevokingId(null);
    }
  };

  const copyInvitationLink = async (
    invitation: Invitation,
  ) => {
    if (!invitation.token) {
      setError(
        "This invitation does not contain a shareable token.",
      );
      return;
    }

    try {
      const link = `${window.location.origin}/invitations/${invitation.token}`;

      await navigator.clipboard.writeText(link);

      setCopiedId(invitation.id);

      window.setTimeout(() => {
        setCopiedId((current) =>
          current === invitation.id ? null : current,
        );
      }, 2000);
    } catch {
      setError("Failed to copy invitation link.");
    }
  };

  return (
    <section className="space-y-6">
      <div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              Workspace Invitations
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Invite people to your workspace and manage
              pending invitations.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadInvitations()}
            disabled={loading}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md border bg-background px-3 text-sm font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                loading ? "animate-spin" : ""
              }`}
            />

            Refresh
          </button>
        </div>
      </div>

      {error ? (
        <div
          role="alert"
          className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-400"
        >
          {error}
        </div>
      ) : null}

      {success ? (
        <div
          role="status"
          className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400"
        >
          {success}
        </div>
      ) : null}

      <div className="rounded-xl border bg-card p-4 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <UserPlus className="h-5 w-5" />
          </div>

          <div>
            <h3 className="font-semibold">
              Invite a member
            </h3>

            <p className="text-sm text-muted-foreground">
              Send an invitation to join this workspace.
            </p>
          </div>
        </div>

        <form
          onSubmit={createInvitation}
          className="grid gap-4 md:grid-cols-[minmax(0,1fr)_180px_auto]"
        >
          <div className="space-y-2">
            <label
              htmlFor="invitation-email"
              className="text-sm font-medium"
            >
              Email address
            </label>

            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <input
                id="invitation-email"
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="member@example.com"
                autoComplete="email"
                disabled={creating}
                className="h-10 w-full rounded-md border bg-background pl-9 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="invitation-role"
              className="text-sm font-medium"
            >
              Role
            </label>

            <select
              id="invitation-role"
              value={role}
              onChange={(event) =>
                setRole(
                  event.target.value as InvitationRole,
                )
              }
              disabled={creating}
              className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="OWNER">Owner</option>
              <option value="ADMIN">Admin</option>
              <option value="MEMBER">Member</option>
              <option value="VIEWER">Viewer</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={
                creating || email.trim().length === 0
              }
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
            >
              {creating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Mail className="h-4 w-4" />
              )}

              {creating ? "Sending..." : "Send Invite"}
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-xl border bg-card shadow-sm">
        <div className="border-b px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold">
                Invitation History
              </h3>

              <p className="text-sm text-muted-foreground">
                {invitations.length} invitation
                {invitations.length === 1 ? "" : "s"}
              </p>
            </div>

            <Shield className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-40 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : invitations.length === 0 ? (
          <div className="flex min-h-40 flex-col items-center justify-center px-6 text-center">
            <Mail className="mb-3 h-8 w-8 text-muted-foreground" />

            <p className="font-medium">
              No invitations yet
            </p>

            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Create an invitation above to add someone
              to this workspace.
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {invitations.map((invitation) => {
              const canRevoke =
                invitation.status === "PENDING";

              return (
                <div
                  key={invitation.id}
                  className="p-4 sm:p-6"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0 space-y-2">
                      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
                        <div className="flex min-w-0 items-center gap-2">
                          <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />

                          <span className="truncate font-medium">
                            {invitation.email}
                          </span>
                        </div>

                        <span
                          className={`inline-flex w-fit items-center rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClassName(
                            invitation.status,
                          )}`}
                        >
                          {
                            STATUS_LABELS[
                              invitation.status
                            ]
                          }
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span>
                          Role:{" "}
                          <span className="font-medium text-foreground">
                            {ROLE_LABELS[
                              invitation.role
                            ]}
                          </span>
                        </span>

                        <span>
                          Invited by:{" "}
                          <span className="font-medium text-foreground">
                            {invitation.inviter.name ||
                              invitation.inviter.email}
                          </span>
                        </span>

                        <span>
                          Created:{" "}
                          {formatDate(
                            invitation.createdAt,
                          )}
                        </span>

                        <span>
                          Expires:{" "}
                          {formatDate(
                            invitation.expiresAt,
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 lg:shrink-0">
                      {invitation.status === "PENDING" &&
                      invitation.token ? (
                        <button
                          type="button"
                          onClick={() =>
                            void copyInvitationLink(
                              invitation,
                            )
                          }
                          className="inline-flex h-9 items-center justify-center gap-2 rounded-md border bg-background px-3 text-sm font-medium transition-colors hover:bg-muted"
                        >
                          {copiedId === invitation.id ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Clipboard className="h-4 w-4" />
                          )}

                          {copiedId === invitation.id
                            ? "Copied"
                            : "Copy Link"}
                        </button>
                      ) : null}

                      {canRevoke ? (
                        <button
                          type="button"
                          onClick={() =>
                            void revokeInvitation(
                              invitation.id,
                            )
                          }
                          disabled={
                            revokingId === invitation.id
                          }
                          className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-red-500/30 bg-background px-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50 dark:text-red-400"
                        >
                          {revokingId ===
                          invitation.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}

                          {revokingId === invitation.id
                            ? "Revoking..."
                            : "Revoke"}
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}