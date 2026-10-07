import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { invitationService } from "@/server/services/invitation.service";

type RouteContext = {
  params: Promise<{
    token: string;
  }>;
};

export async function GET(
  request: Request,
  context: RouteContext,
) {
  void request;

  try {
    const { token } =
      await context.params;

    const invitation =
      await invitationService.getInvitationByToken(
        token,
      );

    return NextResponse.json({
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
        expiresAt:
          invitation.expiresAt,
        organization:
          invitation.organization,
        inviter: invitation.inviter,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to load invitation.";

    return NextResponse.json(
      { error: message },
      { status: 404 },
    );
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

    if (!session.user.email) {
      return NextResponse.json(
        {
          error:
            "Your account does not have a verified email address.",
        },
        { status: 400 },
      );
    }

    const { token } =
      await context.params;

    const result =
      await invitationService.acceptInvitation({
        token,
        userId: session.user.id,
        userEmail: session.user.email,
      });

    return NextResponse.json({
      message: result.alreadyMember
        ? "You are already a member of this workspace."
        : "Invitation accepted successfully.",
      organizationId:
        result.organizationId,
      alreadyMember:
        result.alreadyMember,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to accept invitation.";

    const status =
      message.includes("different email") ||
      message.includes("expired") ||
      message.includes("ACCEPTED") ||
      message.includes("REVOKED")
        ? 409
        : message.includes("not found")
          ? 404
          : 500;

    return NextResponse.json(
      { error: message },
      { status },
    );
  }
}