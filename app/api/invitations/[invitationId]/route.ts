import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { invitationAuthorizationService } from "@/server/services/invitation-authorization.service";
import { invitationService } from "@/server/services/invitation.service";
import { workspaceContextService } from "@/server/services/workspace-context.service";

type RouteContext = {
  params: Promise<{
    invitationId: string;
  }>;
};

export async function DELETE(
  _request: Request,
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

    await invitationAuthorizationService.authorizeManage(
      workspace.id,
      session.user.id,
    );

    const { invitationId } = await context.params;

    const result =
      await invitationService.revoke(
        invitationId,
        workspace.id,
      );

    return NextResponse.json({
      invitation: result,
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
      error.message === "INVITATION_NOT_PENDING"
    ) {
      return NextResponse.json(
        { error: "Only pending invitations can be revoked." },
        { status: 409 },
      );
    }

    if (
      error instanceof Error &&
      error.message ===
        "INVITATION_MANAGEMENT_FORBIDDEN"
    ) {
      return NextResponse.json(
        { error: "You cannot manage invitations." },
        { status: 403 },
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
