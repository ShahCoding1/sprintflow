import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { invitationService } from "@/server/services/invitation.service";
import { invitationAuthorizationService } from "@/server/services/invitation-authorization.service";
import { workspaceContextService } from "@/server/services/workspace-context.service";
import { createInvitationSchema } from "@/features/invitation/schemas/invitation.schema";

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
      await invitationService.list(workspace.id);

    return NextResponse.json({
      invitations,
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

    console.error(
      "GET /api/invitations failed:",
      error,
    );

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

    const body = await request.json();

    const parsed =
      createInvitationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid invitation data.",
          issues: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const invitation =
      await invitationService.create(
        workspace.id,
        session.user.id,
        parsed.data,
      );

    return NextResponse.json(
      {
        invitation,
      },
      { status: 201 },
    );
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
      error.message ===
        "INVITATION_ROLE_ASSIGNMENT_FORBIDDEN"
    ) {
      return NextResponse.json(
        {
          error:
            "You are not allowed to assign this organization role.",
        },
        { status: 403 },
      );
    }

    if (
      error instanceof Error &&
      error.message === "USER_ALREADY_MEMBER"
    ) {
      return NextResponse.json(
        {
          error:
            "This user is already a member of the workspace.",
        },
        { status: 409 },
      );
    }

    if (
      error instanceof Error &&
      error.message ===
        "INVITATION_ALREADY_PENDING"
    ) {
      return NextResponse.json(
        {
          error:
            "A pending invitation already exists for this email.",
        },
        { status: 409 },
      );
    }

    console.error(
      "POST /api/invitations failed:",
      error,
    );

    return NextResponse.json(
      { error: "Failed to create invitation." },
      { status: 500 },
    );
  }
}