import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { createInvitationSchema } from "@/features/invitation/schemas/invitation.schema";
import { invitationAuthorizationService } from "@/server/services/invitation-authorization.service";
import { invitationService } from "@/server/services/invitation.service";
import { workspaceContextService } from "@/server/services/workspace-context.service";

export async function GET() {
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

    const invitations =
      await invitationService.list(
        workspace.id,
      );

    return NextResponse.json({
      invitations,
    });
  } catch (error) {
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

    console.error("GET /api/invitations failed:", error);

    return NextResponse.json(
      { error: "Failed to load invitations." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
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

    const body = await request.json();

    const parsed =
      createInvitationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            parsed.error.issues[0]?.message ??
            "Invalid invitation data.",
        },
        { status: 400 },
      );
    }

    const invitation =
      await invitationService.create({
        organizationId: workspace.id,
        inviterId: session.user.id,
        email: parsed.data.email,
        role: parsed.data.role,
      });

    return NextResponse.json(
      { invitation },
      { status: 201 },
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "USER_ALREADY_MEMBER"
    ) {
      return NextResponse.json(
        { error: "This user is already a workspace member." },
        { status: 409 },
      );
    }

    if (
      error instanceof Error &&
      error.message ===
        "INVITATION_ALREADY_PENDING"
    ) {
      return NextResponse.json(
        { error: "A pending invitation already exists for this email." },
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

    console.error("POST /api/invitations failed:", error);

    return NextResponse.json(
      { error: "Failed to create invitation." },
      { status: 500 },
    );
  }
}
