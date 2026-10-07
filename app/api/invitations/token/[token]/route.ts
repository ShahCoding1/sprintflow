import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { invitationService } from "@/server/services/invitation.service";

type RouteContext = {
  params: Promise<{
    token: string;
  }>;
};

function getErrorResponse(error: unknown) {
  if (!(error instanceof Error)) {
    return NextResponse.json(
      { error: "Invitation request failed." },
      { status: 500 },
    );
  }

  switch (error.message) {
    case "INVITATION_NOT_FOUND":
      return NextResponse.json(
        { error: "Invitation not found." },
        { status: 404 },
      );

    case "INVITATION_EXPIRED":
      return NextResponse.json(
        { error: "This invitation has expired." },
        { status: 410 },
      );

    case "INVITATION_NOT_PENDING":
      return NextResponse.json(
        { error: "This invitation is no longer active." },
        { status: 409 },
      );

    case "USER_ALREADY_MEMBER":
      return NextResponse.json(
        {
          error:
            "You are already a member of this workspace.",
        },
        { status: 409 },
      );

    case "USER_NOT_FOUND":
      return NextResponse.json(
        {
          error:
            "No account exists for this invitation email.",
        },
        { status: 404 },
      );

    case "INVITATION_EMAIL_MISMATCH":
      return NextResponse.json(
        {
          error:
            "This invitation belongs to a different email address.",
        },
        { status: 403 },
      );

    default:
      console.error(
        "Invitation token API error:",
        error,
      );

      return NextResponse.json(
        { error: "Invitation request failed." },
        { status: 500 },
      );
  }
}

export async function GET(
  request: Request,
  context: RouteContext,
) {
  try {
    const { token } = await context.params;

    if (!token) {
      return NextResponse.json(
        { error: "Invitation token is required." },
        { status: 400 },
      );
    }

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
    return getErrorResponse(error);
  }
}

export async function POST(
  request: Request,
  context: RouteContext,
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error:
            "You must be signed in to accept this invitation.",
        },
        { status: 401 },
      );
    }

    const { token } = await context.params;

    if (!token) {
      return NextResponse.json(
        { error: "Invitation token is required." },
        { status: 400 },
      );
    }

    const invitation =
      await invitationService.getByToken(token);

    const member =
      await invitationService.accept(
        invitation.id,
        session.user.id,
      );

    return NextResponse.json(
      {
        message: "Invitation accepted successfully.",
        member,
      },
      { status: 200 },
    );
  } catch (error) {
    return getErrorResponse(error);
  }
}