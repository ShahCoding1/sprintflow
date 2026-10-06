import { NextResponse } from "next/server";

import { addProjectMemberSchema } from "@/features/project/schemas/project-member.schema";
import { projectMemberService } from "@/server/services/project-member.service";
import { workspaceContextService } from "@/server/services/workspace-context.service";

type ProjectMembersRouteContext = {
  params: Promise<{
    projectId: string;
  }>;
};

export async function GET(
  _request: Request,
  { params }: ProjectMembersRouteContext,
) {
  try {
    const { projectId } = await params;

    if (!projectId) {
      return NextResponse.json(
        {
          success: false,
          message: "Project ID is required.",
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

    const members =
      await projectMemberService.getProjectMembers({
        projectId,
        organizationId: workspace.id,
      });

    return NextResponse.json({
      success: true,
      members,
    });
  } catch (error) {
    console.error(
      "Get project members error:",
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

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to retrieve project members.",
      },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
  { params }: ProjectMembersRouteContext,
) {
  try {
    const { projectId } = await params;

    if (!projectId) {
      return NextResponse.json(
        {
          success: false,
          message: "Project ID is required.",
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
      addProjectMemberSchema.safeParse(body);

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
      await projectMemberService.addProjectMember({
        projectId,
        organizationId: workspace.id,
        actorUserId: workspace.userId,
        userId: parsed.data.userId,
        role: parsed.data.role,
      });

    return NextResponse.json(
      {
        success: true,
        message:
          "Project member added successfully.",
        member,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(
      "Add project member error:",
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
      error.message.includes(
        "not a member of this workspace",
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

    if (
      error instanceof Error &&
      error.message.includes(
        "already a member",
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
          "Unable to add project member.",
      },
      { status: 500 },
    );
  }
}