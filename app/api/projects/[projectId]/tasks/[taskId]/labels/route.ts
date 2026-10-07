import { auth } from "@/auth";
import { NextResponse } from "next/server";

import {
  addTaskLabelSchema,
  removeTaskLabelSchema,
} from "@/features/task/schemas/task-label.schema";
import { taskLabelAuthorizationService } from "@/server/services/task-label-authorization.service";
import { taskLabelService } from "@/server/services/task-label.service";
import { workspaceContextService } from "@/server/services/workspace-context.service";

type TaskLabelRouteContext = {
  params: Promise<{
    projectId: string;
    taskId: string;
  }>;
};

export async function GET(
  _request: Request,
  { params }: TaskLabelRouteContext,
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 },
      );
    }

    const { projectId, taskId } = await params;

    const workspace =
      await workspaceContextService.getWorkspaceContext();

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace not selected." },
        { status: 400 },
      );
    }

    await taskLabelAuthorizationService.authorize({
      organizationId: workspace.id,
      projectId,
      taskId,
      userId: session.user.id,
      action: "VIEW",
    });

    const assignments =
      await taskLabelService.getTaskLabels({
        taskId,
        projectId,
        organizationId: workspace.id,
      });

    return NextResponse.json(
      assignments.map((assignment) => assignment.label),
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to load task labels.";

    if (message === "Task not found.") {
      return NextResponse.json(
        { error: message },
        { status: 404 },
      );
    }

    if (
      message.includes("permission") ||
      message.includes("member")
    ) {
      return NextResponse.json(
        { error: message },
        { status: 403 },
      );
    }

    console.error(
      "GET task labels failed:",
      error,
    );

    return NextResponse.json(
      { error: "Failed to load task labels." },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
  { params }: TaskLabelRouteContext,
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 },
      );
    }

    const { projectId, taskId } = await params;

    const workspace =
      await workspaceContextService.getWorkspaceContext();

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace not selected." },
        { status: 400 },
      );
    }

    await taskLabelAuthorizationService.authorize({
      organizationId: workspace.id,
      projectId,
      taskId,
      userId: session.user.id,
      action: "ADD",
    });

    const body = await request.json();

    const parsed =
      addTaskLabelSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed.",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const assignment =
      await taskLabelService.addLabel({
        taskId,
        projectId,
        organizationId: workspace.id,
        labelId: parsed.data.labelId,
      });

    return NextResponse.json(
      assignment.label,
      { status: 201 },
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to assign label.";

    if (
      message === "Task not found." ||
      message === "Label not found."
    ) {
      return NextResponse.json(
        { error: message },
        { status: 404 },
      );
    }

    if (
      message.includes("permission") ||
      message.includes("member")
    ) {
      return NextResponse.json(
        { error: message },
        { status: 403 },
      );
    }

    if (message.includes("already assigned")) {
      return NextResponse.json(
        { error: message },
        { status: 409 },
      );
    }

    console.error(
      "POST task label failed:",
      error,
    );

    return NextResponse.json(
      { error: "Failed to assign label." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: TaskLabelRouteContext,
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 },
      );
    }

    const { projectId, taskId } = await params;

    const workspace =
      await workspaceContextService.getWorkspaceContext();

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace not selected." },
        { status: 400 },
      );
    }

    await taskLabelAuthorizationService.authorize({
      organizationId: workspace.id,
      projectId,
      taskId,
      userId: session.user.id,
      action: "REMOVE",
    });

    const body = await request.json();

    const parsed =
      removeTaskLabelSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed.",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    await taskLabelService.removeLabel({
      taskId,
      projectId,
      organizationId: workspace.id,
      labelId: parsed.data.labelId,
    });

    return new NextResponse(null, {
      status: 204,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to remove label.";

    if (
      message === "Task not found." ||
      message === "Label not found."
    ) {
      return NextResponse.json(
        { error: message },
        { status: 404 },
      );
    }

    if (
      message.includes("permission") ||
      message.includes("member")
    ) {
      return NextResponse.json(
        { error: message },
        { status: 403 },
      );
    }

    if (message.includes("not assigned")) {
      return NextResponse.json(
        { error: message },
        { status: 404 },
      );
    }

    console.error(
      "DELETE task label failed:",
      error,
    );

    return NextResponse.json(
      { error: "Failed to remove label." },
      { status: 500 },
    );
  }
}