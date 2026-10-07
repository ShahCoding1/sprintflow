import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { createCommentSchema } from "@/features/comment/schemas/create-comment.schema";
import { commentAuthorizationService } from "@/server/services/comment-authorization.service";
import { commentService } from "@/server/services/comment.service";
import { workspaceContextService } from "@/server/services/workspace-context.service";

type RouteContext = {
  params: Promise<{
    projectId: string;
    taskId: string;
  }>;
};

export async function GET(
  _request: NextRequest,
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

    const { projectId, taskId } = await context.params;

    const workspace =
      await workspaceContextService.getWorkspaceContext();

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace context is required." },
        { status: 400 },
      );
    }

    const comments =
      await commentService.getComments({
        taskId,
        projectId,
        organizationId: workspace.id,
      });

    return NextResponse.json(comments);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to fetch comments.";

    const status =
      message === "Task not found."
        ? 404
        : 500;

    return NextResponse.json(
      { error: message },
      { status },
    );
  }
}

export async function POST(
  request: NextRequest,
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

    const { projectId, taskId } = await context.params;

    const workspace =
      await workspaceContextService.getWorkspaceContext();

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace context is required." },
        { status: 400 },
      );
    }

    const body: unknown = await request.json();

    const parsed =
      createCommentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid comment.",
          issues: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    await commentAuthorizationService.authorize({
      organizationId: workspace.id,
      projectId,
      taskId,
      userId: session.user.id,
      action: "CREATE",
    });

    const comment =
      await commentService.createComment({
        taskId,
        projectId,
        organizationId: workspace.id,
        userId: session.user.id,
        content: parsed.data.content,
      });

    return NextResponse.json(
      comment,
      { status: 201 },
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to create comment.";

    const status =
      message === "Task not found."
        ? 404
        : message.includes("permission") ||
            message.includes("member")
          ? 403
          : 500;

    return NextResponse.json(
      { error: message },
      { status },
    );
  }
}