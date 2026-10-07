import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { invitationService } from "@/server/services/invitation.service";
import { workspaceContextService } from "@/server/services/workspace-context.service";

type RouteContext = {
  params: Promise<{
    invitationId: string;
  }>;
};

export async function DELETE(
  request: Request,
  context: RouteContext,
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 },
      );
    }

    const workspace =
      await workspaceContextService.getWorkspaceContext();

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace context is required." },
        { status: 400 },
      );
    }

    const { invitationId } = await context.params;

    if (!invitationId) {
      return NextResponse.json(
        { error: "Invitation ID is required." },
        { status: 400 },
      );
    }

    const invitation =
      await invitationService.revoke(
        workspace.id,
        session.user.id,
        invitationId,
      );

    return NextResponse.json({
      invitation,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message ===
        "WORKSPACE_MEMBERSHIP_REQUIRED"
    ) {
      return NextResponse.json(
        { error: "Workspace membership is required." },
        { status: 403 },
      );
    }

    if (
      error instanceof Error &&
      error.message ===
        "INVITATION_MANAGEMENT_FORBIDDEN"
    ) {
      return NextResponse.json(
        { error: "Invitation management is forbidden." },
        { status: 403 },
      );
    }

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
      error.message === "INVITATION_NOT_PENDING"
    ) {
      return NextResponse.json(
        {
          error:
            "Only pending invitations can be revoked.",
        },
        { status: 409 },
      );
    }

    console.error(
      "DELETE /api/invitations/[invitationId] failed:",
      error,
    );

    return NextResponse.json(
      { error: "Failed to revoke invitation." },
      { status: 500 },
    );
  }
}