"use client";

import {
  Check,
  Clock3,
  Copy,
  Loader2,
  MailPlus,
  RefreshCw,
  Shield,
  UserPlus,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

type InvitationRole =
  | "OWNER"
  | "ADMIN"
  | "MEMBER"
  | "VIEWER";

type InvitationStatus =
  | "PENDING"
  | "ACCEPTED"
  | "REVOKED"
  | "EXPIRED";

type Invitation = {
  id: string;
  email: string;
  role: InvitationRole;
  status: InvitationStatus;
  expiresAt: string;
  createdAt: string;
  inviter: {
    id: string;
    name: string | null;
    email: string;
  };
};

const roleLabels: Record<
  InvitationRole,
  string
> = {
  OWNER: "Owner",
  ADMIN: "Administrator",
  MEMBER: "Member",
  VIEWER: "Viewer",
};

function getStatusClasses(
  status: InvitationStatus,
) {
  switch (status) {
    case "PENDING":
      return "bg-amber-500/10 text-amber-700 dark:text-amber-300";

    case "ACCEPTED":
      return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";

    case "REVOKED":
      return "bg-destructive/10 text-destructive";

    case "EXPIRED":
    default:
      return "bg-muted text-muted-foreground";
  }
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(
    undefined,
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    },
  );
}

export default function InvitationManagement() {
  const [invitations, setInvitations] =
    useState<Invitation[]>([]);

  const [email, setEmail] = useState("");

  const [role, setRole] =
    useState<InvitationRole>("MEMBER");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [inviteUrl, setInviteUrl] =
    useState("");

  const [copied, setCopied] =
    useState(false);

  async function loadInvitations() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        "/api/invitations",
        {
          cache: "no-store",
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ??
            "Unable to load invitations.",
        );
      }

      setInvitations(
        result.invitations ?? [],
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load invitations.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadInvitations();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  async function handleCreateInvitation(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setSaving(true);
    setError(null);
    setInviteUrl("");
    setCopied(false);

    try {
      const response = await fetch(
        "/api/invitations",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            email,
            role,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ??
            "Unable to create invitation.",
        );
      }

      setInviteUrl(
        result.inviteUrl ?? "",
      );

      setEmail("");
      setRole("MEMBER");

      await loadInvitations();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create invitation.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleRevoke(
    invitationId: string,
  ) {
    setError(null);

    try {
      const response = await fetch(
        `/api/invitations/${invitationId}`,
        {
          method: "DELETE",
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ??
            "Unable to revoke invitation.",
        );
      }

      await loadInvitations();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to revoke invitation.",
      );
    }
  }

  async function handleCopy() {
    if (!inviteUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        inviteUrl,
      );

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      setError(
        "Unable to copy the invitation link.",
      );
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <UserPlus className="size-5 text-primary" />
          </div>

          <div className="min-w-0">
            <h2 className="text-lg font-semibold">
              Invite a workspace member
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Create a secure invitation link that
              expires after seven days.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleCreateInvitation}
          className="mt-5 grid gap-4 md:grid-cols-[minmax(0,1fr)_190px_auto]"
        >
          <div className="space-y-2">
            <label
              htmlFor="invitation-email"
              className="text-sm font-medium"
            >
              Email address
            </label>

            <input
              id="invitation-email"
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="developer@example.com"
              required
              disabled={saving}
              className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="invitation-role"
              className="text-sm font-medium"
            >
              Workspace role
            </label>

            <select
              id="invitation-role"
              value={role}
              onChange={(event) =>
                setRole(
                  event.target
                    .value as InvitationRole,
                )
              }
              disabled={saving}
              className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
            >
              <option value="MEMBER">
                Member
              </option>

              <option value="VIEWER">
                Viewer
              </option>

              <option value="ADMIN">
                Administrator
              </option>

              <option value="OWNER">
                Owner
              </option>
            </select>
          </div>

          <button
            type="submit"
            disabled={saving || !email.trim()}
            className="mt-auto inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:pointer-events-none disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <MailPlus className="size-4" />
            )}

            Invite
          </button>
        </form>

        {inviteUrl && (
          <div className="mt-5 rounded-xl border bg-muted/40 p-4">
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">
                  Invitation created
                </p>

                <p className="mt-1 break-all text-xs text-muted-foreground">
                  {inviteUrl}
                </p>
              </div>

              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border bg-background hover:bg-muted"
                aria-label="Copy invitation link"
              >
                {copied ? (
                  <Check className="size-4" />
                ) : (
                  <Copy className="size-4" />
                )}
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="rounded-2xl border bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <h2 className="text-lg font-semibold">
              Invitations
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Track pending and completed workspace
              invitations.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              void loadInvitations()
            }
            disabled={loading}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-medium hover:bg-muted disabled:opacity-50"
          >
            <RefreshCw
              className={`size-4 ${
                loading
                  ? "animate-spin"
                  : ""
              }`}
            />

            Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex min-h-40 items-center justify-center">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : invitations.length === 0 ? (
          <div className="p-10 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-muted">
              <Shield className="size-6 text-muted-foreground" />
            </div>

            <h3 className="mt-4 font-semibold">
              No invitations yet
            </h3>

            <p className="mt-1 text-sm text-muted-foreground">
              New workspace invitations will appear
              here.
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {invitations.map(
              (invitation) => (
                <div
                  key={invitation.id}
                  className="flex flex-col gap-4 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="break-all text-sm font-medium">
                        {invitation.email}
                      </span>

                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${getStatusClasses(
                          invitation.status,
                        )}`}
                      >
                        {invitation.status}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>
                        Role:{" "}
                        {roleLabels[
                          invitation.role
                        ]}
                      </span>

                      <span className="flex items-center gap-1">
                        <Clock3 className="size-3.5" />
                        Expires{" "}
                        {formatDate(
                          invitation.expiresAt,
                        )}
                      </span>

                      <span>
                        Invited by{" "}
                        {invitation.inviter.name ??
                          invitation.inviter.email}
                      </span>
                    </div>
                  </div>

                  {invitation.status ===
                    "PENDING" && (
                    <button
                      type="button"
                      onClick={() =>
                        void handleRevoke(
                          invitation.id,
                        )
                      }
                      className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-destructive/30 px-3 text-sm font-medium text-destructive hover:bg-destructive/5"
                    >
                      <X className="size-4" />
                      Revoke
                    </button>
                  )}
                </div>
              ),
            )}
          </div>
        )}
      </section>
    </div>
  );
}