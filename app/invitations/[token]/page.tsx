"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

type Invitation = {
  id: string;
  email: string;
  role: "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";
  status: string;
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

function formatRole(role: Invitation["role"]) {
  return role.charAt(0) + role.slice(1).toLowerCase();
}

export default function InvitationPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();

  const [invitation, setInvitation] =
    useState<Invitation | null>(null);

  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState("");

  const loadInvitation = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/invitations/token/${encodeURIComponent(params.token)}`,
        {
          cache: "no-store",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ?? "Unable to load invitation.",
        );
      }

      setInvitation(data.invitation);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load invitation.",
      );
    } finally {
      setLoading(false);
    }
  }, [params.token]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadInvitation();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadInvitation]);

  async function acceptInvitation() {
    try {
      setAccepting(true);
      setError("");

      const response = await fetch(
        `/api/invitations/token/${encodeURIComponent(params.token)}`,
        {
          method: "POST",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ?? "Unable to accept invitation.",
        );
      }

      router.push("/dashboard");
      router.refresh();
    } catch (acceptError) {
      setError(
        acceptError instanceof Error
          ? acceptError.message
          : "Unable to accept invitation.",
      );
    } finally {
      setAccepting(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border bg-card p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
          <h1 className="text-lg font-semibold">
            Loading invitation
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Please wait while we validate your invitation.
          </p>
        </div>
      </main>
    );
  }

  if (error || !invitation) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-sm">
          <h1 className="text-xl font-semibold">
            Invitation unavailable
          </h1>

          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {error || "This invitation could not be loaded."}
          </p>

          <Link
            href="/login"
            className="mt-6 inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Go to login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
        <p className="text-sm font-medium text-primary">
          SprintFlow workspace invitation
        </p>

        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Join {invitation.organization.name}
        </h1>

        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {invitation.inviter.name ||
            invitation.inviter.email}{" "}
          invited you to join this workspace.
        </p>

        <div className="mt-6 grid gap-3 rounded-xl border bg-muted/30 p-4 text-sm">
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">
              Invited email
            </span>

            <span className="break-all font-medium">
              {invitation.email}
            </span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">
              Workspace role
            </span>

            <span className="font-medium">
              {formatRole(invitation.role)}
            </span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">
              Expires
            </span>

            <span className="font-medium">
              {new Date(
                invitation.expiresAt,
              ).toLocaleDateString()}
            </span>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-5 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={acceptInvitation}
          disabled={accepting}
          className="mt-6 flex h-11 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {accepting
            ? "Joining workspace..."
            : "Accept invitation"}
        </button>

        <p className="mt-4 text-center text-xs leading-5 text-muted-foreground">
          You must be signed in with the invited email address
          to accept this invitation.
        </p>
      </div>
    </main>
  );
}