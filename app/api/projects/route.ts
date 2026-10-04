import { NextResponse } from "next/server";

import { createProjectSchema } from "@/features/project/schemas/create-project.schema";
import { workspaceContextService } from "@/server/services/workspace-context.service";
import { projectService } from "@/server/services/project.service";

export async function GET() {
  try {
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

    const projects = await projectService.getProjects(
      workspace.id,
    );

    return NextResponse.json({
      success: true,
      projects,
    });
  } catch (error) {
    console.error("Get projects error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to retrieve projects.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
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

    const parsed = createProjectSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid project data.",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const project = await projectService.createProject({
      organizationId: workspace.id,
      name: parsed.data.name,
      key: parsed.data.key,
      description: parsed.data.description,
      startDate: parsed.data.startDate,
      endDate: parsed.data.endDate,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Project created successfully.",
        project,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create project error:", error);

    if (
      error instanceof Error &&
      error.message.includes("already exists")
    ) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Unable to create project.",
      },
      { status: 500 },
    );
  }
}