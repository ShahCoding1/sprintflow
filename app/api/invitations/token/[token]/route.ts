import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { invitationService } from "@/server/services/invitation.service";

type RouteContext = {
  params: Promise<{
    token: string;
  }>;
};

export async function GET(
  _request: Request,
  context: RouteContext,
) {
  try {
    const { token } = await context.params;

    const invitation =
      await invitationService.getByToken(token);

    return NextResponse.json({
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
        organization: invitation.organization,
        inviter: invitation.inviter,
      },
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "INVITATION_NOT_FOUND"
    ) {
      return NextResponse.json(
        { error: "Invitation not found." },
        { status: 404 },
      );
    }

    if (
      error instanceof Error &&
      error.message === "INVITATION_EXPIRED"
    ) {
      return NextResponse.json(
        { error: "This invitation has expired." },
        { status: 410 },
      );
    }

    if (
      error instanceof Error &&
      error.message === "INVITATION_NOT_PENDING"
    ) {
      return NextResponse.json(
        { error: "This invitation is no longer active." },
        { status: 409 },
      );
    }

    console.error(
      "GET /api/invitations/token/[token] failed:",
      error,
    );

    return NextResponse.json(
      { error: "Failed to load invitation." },
      { status: 500 },
    );
  }
}

export async function POST(
  _request: Request,
  context: RouteContext,
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must sign in before accepting an invitation." },
        { status: 401 },
      );
    }

    const { token } = await context.params;

    const invitation =
      await invitationService.accept(
        token,
        session.user.id,
      );

    return NextResponse.json({
      invitation,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "INVITATION_NOT_FOUND"
    ) {
      return NextResponse.json(
        { error: "Invitation not found." },
        { status: 404 },
      );
    }

    if (
      error instanceof Error &&
      error.message === "INVITATION_EXPIRED"
    ) {
      return NextResponse.json(
        { error: "This invitation has expired." },
        { status: 410 },
      );
    }

    if (
      error instanceof Error &&
      error.message === "INVITATION_NOT_PENDING"
    ) {
      return NextResponse.json(
        { error: "This invitation is no longer active." },
        { status: 409 },
      );
    }

    if (
      error instanceof Error &&
      error.message ===
        "INVITATION_EMAIL_MISMATCH"
    ) {
      return NextResponse.json(
        {
          error:
            "The signed-in account does not match the invited email address.",
        },
        { status: 403 },
      );
    }

    console.error(
      "POST /api/invitations/token/[token] failed:",
      error,
    );

    return NextResponse.json(
      { error: "Failed to accept invitation." },
      { status: 500 },
    );
  }
}