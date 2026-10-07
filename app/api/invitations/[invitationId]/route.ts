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
  void request;

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
        { error: "Workspace not found." },
        { status: 404 },
      );
    }

    const { invitationId } =
      await context.params;

    const invitation =
      await invitationService.revokeInvitation({
        organizationId: workspace.id,
        userId: session.user.id,
        invitationId,
      });

    return NextResponse.json({
      invitation,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to revoke invitation.";

    const status =
      message.includes("not found")
        ? 404
        : message.includes("not authorized") ||
            message.includes("cannot revoke")
          ? 403
          : message.includes("Only pending")
            ? 409
            : 500;

    return NextResponse.json(
      { error: message },
      { status },
    );
  }
}