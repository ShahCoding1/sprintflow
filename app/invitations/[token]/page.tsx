"use client";

import {
  CheckCircle2,
  Clock3,
  Loader2,
  ShieldCheck,
  UserPlus,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Invitation = {
  id: string;
  email: string;
  role:
    | "OWNER"
    | "ADMIN"
    | "MEMBER"
    | "VIEWER";
  status:
    | "PENDING"
    | "ACCEPTED"
    | "REVOKED"
    | "EXPIRED";
  expiresAt: string;
  organization: {
    id: string;
    name: string;
  };
  inviter: {
    id: string;
    name: string | null;
    email: string;
  };
};

export default function InvitationPage() {
  const params = useParams();
  const router = useRouter();

  const token = String(params.token);

  const [invitation, setInvitation] =
    useState<Invitation | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [accepting, setAccepting] =
    useState(false);

  const [error, setError] =
    useState("");

  const [accepted, setAccepted] =
    useState(false);

  useEffect(() => {
    async function loadInvitation() {
      try {
        const response = await fetch(
          `/api/invitations/token/${token}`,
          {
            cache: "no-store",
          },
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.error ??
              "Invitation not found.",
          );
        }

        setInvitation(
          result.invitation,
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load invitation.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadInvitation();
  }, [token]);

  async function acceptInvitation() {
    setAccepting(true);
    setError("");

    try {
      const response = await fetch(
        `/api/invitations/token/${token}`,
        {
          method: "POST",
        },
      );

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(
            "You must sign in with the invited email address before accepting this invitation.",
          );
        }

        throw new Error(
          result.error ??
            "Unable to accept invitation.",
        );
      }

      setAccepted(true);

      window.setTimeout(() => {
        router.push("/dashboard");
      }, 1200);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to accept invitation.",
      );
    } finally {
      setAccepting(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </main>
    );
  }

  if (error && !invitation) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
        <section className="w-full max-w-md rounded-2xl border bg-card p-6 text-center shadow-sm sm:p-8">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10">
            <XCircle className="size-6 text-destructive" />
          </div>

          <h1 className="mt-5 text-xl font-semibold">
            Invitation unavailable
          </h1>

          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {error}
          </p>

          <Link
            href="/"
            className="mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
          >
            Go to SprintFlow
          </Link>
        </section>
      </main>
    );
  }

  if (!invitation) {
    return null;
  }

  if (accepted) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
        <section className="w-full max-w-md rounded-2xl border bg-card p-6 text-center shadow-sm sm:p-8">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-500/10">
            <CheckCircle2 className="size-6 text-emerald-600" />
          </div>

          <h1 className="mt-5 text-xl font-semibold">
            Invitation accepted
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            You have joined{" "}
            <strong>
              {invitation.organization.name}
            </strong>
            .
          </p>

          <p className="mt-4 text-xs text-muted-foreground">
            Redirecting to your dashboard…
          </p>
        </section>
      </main>
    );
  }

  const expired =
    invitation.status === "EXPIRED";

  const unavailable =
    invitation.status !== "PENDING";

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <section className="w-full max-w-lg rounded-2xl border bg-card shadow-sm">
        <div className="p-6 text-center sm:p-8">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10">
            <UserPlus className="size-7 text-primary" />
          </div>

          <p className="mt-5 text-sm text-muted-foreground">
            You have been invited to join
          </p>

          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            {invitation.organization.name}
          </h1>

          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {invitation.inviter.name ??
              invitation.inviter.email}{" "}
            invited{" "}
            <strong>
              {invitation.email}
            </strong>{" "}
            as a{" "}
            <strong>
              {invitation.role.toLowerCase()}
            </strong>
            .
          </p>

          <div className="mt-6 rounded-xl border bg-muted/30 p-4 text-left">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />

              <div>
                <p className="text-sm font-medium">
                  Workspace access
                </p>

                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  This invitation only grants the
                  workspace role shown above. You must
                  accept it while signed in with the
                  invited email address.
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
              <Clock3 className="size-4" />

              Expires{" "}
              {new Date(
                invitation.expiresAt,
              ).toLocaleDateString()}
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-left text-sm text-destructive"
            >
              {error}
            </div>
          )}

          {expired || unavailable ? (
            <div className="mt-6 rounded-xl bg-muted p-4 text-sm text-muted-foreground">
              This invitation is no longer
              available.
            </div>
          ) : (
            <button
              type="button"
              onClick={() =>
                void acceptInvitation()
              }
              disabled={accepting}
              className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
            >
              {accepting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <CheckCircle2 className="size-4" />
              )}

              Accept invitation
            </button>
          )}
        </div>
      </section>
    </main>
  );
}