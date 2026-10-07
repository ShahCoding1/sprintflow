"use client";

import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  LogIn,
  Mail,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type InvitationRole =
  | "OWNER"
  | "ADMIN"
  | "MEMBER"
  | "VIEWER";

type Invitation = {
  id: string;
  email: string;
  role: InvitationRole;
  status: "PENDING";
  expiresAt: string;
  organization: {
    id: string;
    name: string;
    slug: string;
  };
  inviter: {
    id: string;
    name: string | null;
    email: string;
  };
};

type InvitationResponse = {
  invitation: Invitation;
};

type ErrorResponse = {
  error?: string;
};

const ROLE_LABELS: Record<InvitationRole, string> = {
  OWNER: "Owner",
  ADMIN: "Administrator",
  MEMBER: "Member",
  VIEWER: "Viewer",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong.";
}

export default function InvitationPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();

  const token = params?.token;

  const [invitation, setInvitation] =
    useState<Invitation | null>(null);

  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);

  const [error, setError] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [requiresLogin, setRequiresLogin] = useState(false);

  const loadInvitation = useCallback(async () => {
    if (!token) {
      setError("Invalid invitation link.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      setRequiresLogin(false);

      const response = await fetch(
        `/api/invitations/token/${encodeURIComponent(token)}`,
        {
          method: "GET",
          cache: "no-store",
        },
      );

      const data = (await response.json()) as
        | InvitationResponse
        | ErrorResponse;

      if (!response.ok) {
        throw new Error(
          "error" in data && data.error
            ? data.error
            : "Unable to load this invitation.",
        );
      }

      if (!("invitation" in data)) {
        throw new Error(
          "Invalid invitation response.",
        );
      }

      setInvitation(data.invitation);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadInvitation();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadInvitation]);

  const acceptInvitation = async () => {
    if (!token || !invitation) {
      return;
    }

    try {
      setAccepting(true);
      setError("");
      setRequiresLogin(false);

      const response = await fetch(
        `/api/invitations/token/${encodeURIComponent(token)}`,
        {
          method: "POST",
        },
      );

      const data = (await response.json()) as
        | {
            message?: string;
            member?: {
              id: string;
              organizationId: string;
              userId: string;
              role: InvitationRole;
            };
          }
        | ErrorResponse;

      if (response.status === 401) {
        setRequiresLogin(true);
        throw new Error(
          "You must sign in with the invited email address before accepting this invitation.",
        );
      }

      if (!response.ok) {
        throw new Error(
          "error" in data && data.error
            ? data.error
            : "Unable to accept this invitation.",
        );
      }

      setAccepted(true);

      window.setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 1200);
    } catch (acceptError) {
      setError(getErrorMessage(acceptError));
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
        <div className="flex w-full max-w-md flex-col items-center rounded-2xl border bg-card p-8 text-center shadow-sm">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />

          <h1 className="mt-4 text-lg font-semibold">
            Loading invitation
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Please wait while we verify your invitation.
          </p>
        </div>
      </main>
    );
  }

  if (accepted) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
        <div className="w-full max-w-md rounded-2xl border bg-card p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-7 w-7" />
          </div>

          <h1 className="mt-5 text-2xl font-semibold">
            Invitation accepted
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            You are now a member of{" "}
            <span className="font-medium text-foreground">
              {invitation?.organization.name}
            </span>
            .
          </p>

          <p className="mt-4 text-xs text-muted-foreground">
            Redirecting you to your dashboard...
          </p>
        </div>
      </main>
    );
  }

  if (!invitation) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
        <div className="w-full max-w-md rounded-2xl border bg-card p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-red-600 dark:text-red-400">
            <AlertCircle className="h-7 w-7" />
          </div>

          <h1 className="mt-5 text-2xl font-semibold">
            Invitation unavailable
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            {error ||
              "This invitation could not be loaded."}
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={() => void loadInvitation()}
              className="inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-medium transition-colors hover:bg-muted"
            >
              Try Again
            </button>

            <Link
              href="/"
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Go Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-8 sm:py-12">
      <div className="w-full max-w-lg">
        <div className="mb-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <UserPlus className="h-6 w-6" />
          </div>

          <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
            You&apos;re invited
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            You have been invited to join a SprintFlow
            workspace.
          </p>
        </div>

        <div className="rounded-2xl border bg-card shadow-sm">
          <div className="space-y-6 p-5 sm:p-8">
            <div className="rounded-xl border bg-muted/30 p-4 sm:p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Workspace
              </p>

              <h2 className="mt-1 text-xl font-semibold">
                {invitation.organization.name}
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                @{invitation.organization.slug}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />

                  <span className="text-xs font-medium uppercase tracking-wide">
                    Invited email
                  </span>
                </div>

                <p className="mt-2 break-all text-sm font-medium">
                  {invitation.email}
                </p>
              </div>

              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <ShieldCheck className="h-4 w-4" />

                  <span className="text-xs font-medium uppercase tracking-wide">
                    Workspace role
                  </span>
                </div>

                <p className="mt-2 text-sm font-medium">
                  {ROLE_LABELS[invitation.role]}
                </p>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
                <span className="text-muted-foreground">
                  Invited by
                </span>

                <span className="font-medium sm:text-right">
                  {invitation.inviter.name ||
                    invitation.inviter.email}
                </span>
              </div>

              <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
                <span className="text-muted-foreground">
                  Invitation expires
                </span>

                <span className="font-medium sm:text-right">
                  {formatDate(invitation.expiresAt)}
                </span>
              </div>
            </div>

            {error ? (
              <div
                role="alert"
                className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-400"
              >
                <div className="flex gap-3">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

                  <div>
                    <p>{error}</p>

                    {requiresLogin ? (
                      <Link
                        href={`/login?callbackUrl=${encodeURIComponent(
                          `/invitations/${token}`,
                        )}`}
                        className="mt-2 inline-flex items-center gap-2 font-medium underline underline-offset-4"
                      >
                        <LogIn className="h-4 w-4" />
                        Sign in to continue
                      </Link>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => void acceptInvitation()}
              disabled={accepting}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {accepting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}

              {accepting
                ? "Accepting invitation..."
                : "Accept Invitation"}
            </button>

            <p className="text-center text-xs leading-relaxed text-muted-foreground">
              By accepting this invitation, you will
              become a member of this workspace with the
              role shown above.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}