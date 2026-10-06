import { NextResponse } from "next/server";

import { updateProjectMemberSchema } from "@/features/project/schemas/project-member.schema";
import { projectMemberService } from "@/server/services/project-member.service";
import { workspaceContextService } from "@/server/services/workspace-context.service";

type ProjectMemberRouteContext = {
  params: Promise<{
    projectId: string;
    userId: string;
  }>;
};

export async function PATCH(
  request: Request,
  { params }: ProjectMemberRouteContext,
) {
  try {
    const { projectId, userId } = await params;

    if (!projectId || !userId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Project ID and user ID are required.",
        },
        { status: 400 },
      );
    }

    const workspace =
      await workspaceContextService.getWorkspaceContext();

    if (!workspace) {
      return NextResponse.json(
        {
          success: false,
          message: "Workspace context is required.",
        },
        { status: 401 },
      );
    }

    const body: unknown = await request.json();

    const parsed =
      updateProjectMemberSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid project member data.",
          errors:
            parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const member =
      await projectMemberService.updateProjectMemberRole(
        {
          projectId,
          organizationId: workspace.id,
          actorUserId: workspace.userId,
          userId,
          role: parsed.data.role,
        },
      );

    return NextResponse.json({
      success: true,
      message:
        "Project member role updated successfully.",
      member,
    });
  } catch (error) {
    console.error(
      "Update project member error:",
      error,
    );

    if (
      error instanceof Error &&
      error.message === "Project not found."
    ) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: 404 },
      );
    }

    if (
      error instanceof Error &&
      error.message === "Project member not found."
    ) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: 404 },
      );
    }

    if (
      error instanceof Error &&
      error.message.includes(
        "at least one manager",
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: 409 },
      );
    }

    if (
      error instanceof Error &&
      error.message.includes(
        "permission",
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: 403 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to update project member.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: ProjectMemberRouteContext,
) {
  try {
    const { projectId, userId } = await params;

    if (!projectId || !userId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Project ID and user ID are required.",
        },
        { status: 400 },
      );
    }

    const workspace =
      await workspaceContextService.getWorkspaceContext();

    if (!workspace) {
      return NextResponse.json(
        {
          success: false,
          message: "Workspace context is required.",
        },
        { status: 401 },
      );
    }

    await projectMemberService.removeProjectMember({
      projectId,
      organizationId: workspace.id,
      actorUserId: workspace.userId,
      userId,
    });

    return NextResponse.json({
      success: true,
      message:
        "Project member removed successfully.",
    });
  } catch (error) {
    console.error(
      "Remove project member error:",
      error,
    );

    if (
      error instanceof Error &&
      (
        error.message === "Project not found." ||
        error.message === "Project member not found."
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: 404 },
      );
    }

    if (
      error instanceof Error &&
      error.message.includes(
        "at least one manager",
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: 409 },
      );
    }

    if (
      error instanceof Error &&
      error.message.includes(
        "permission",
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: 403 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to remove project member.",
      },
      { status: 500 },
    );
  }
}