import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { commentAuthorizationService } from "@/server/services/comment-authorization.service";
import { commentService } from "@/server/services/comment.service";
import { workspaceContextService } from "@/server/services/workspace-context.service";

type RouteContext = {
  params: Promise<{
    projectId: string;
    commentId: string;
  }>;
};

export async function PATCH(
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

    const { projectId, commentId } =
      await context.params;

    const workspace =
      await workspaceContextService.getWorkspaceContext();

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace context is required." },
        { status: 400 },
      );
    }

    const body: unknown = await request.json();

    if (
      typeof body !== "object" ||
      body === null ||
      !("content" in body) ||
      typeof body.content !== "string"
    ) {
      return NextResponse.json(
        { error: "Comment content is required." },
        { status: 400 },
      );
    }

    const content = body.content.trim();

    if (!content) {
      return NextResponse.json(
        { error: "Comment cannot be empty." },
        { status: 400 },
      );
    }

    if (content.length > 5000) {
      return NextResponse.json(
        {
          error:
            "Comment cannot exceed 5000 characters.",
        },
        { status: 400 },
      );
    }

    await commentAuthorizationService.authorize({
      organizationId: workspace.id,
      projectId,
      commentId,
      userId: session.user.id,
      action: "UPDATE",
    });

    const comment =
      await commentService.updateComment({
        commentId,
        userId: session.user.id,
        content,
      });

    return NextResponse.json(comment);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to update comment.";

    const status =
      message === "Comment not found."
        ? 404
        : message.includes("only modify") ||
            message.includes("permission")
          ? 403
          : 500;

    return NextResponse.json(
      { error: message },
      { status },
    );
  }
}

export async function DELETE(
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

    const { projectId, commentId } =
      await context.params;

    const workspace =
      await workspaceContextService.getWorkspaceContext();

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace context is required." },
        { status: 400 },
      );
    }

    await commentAuthorizationService.authorize({
      organizationId: workspace.id,
      projectId,
      commentId,
      userId: session.user.id,
      action: "DELETE",
    });

    await commentService.deleteComment({
      commentId,
      userId: session.user.id,
    });

    return new NextResponse(null, {
      status: 204,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to delete comment.";

    const status =
      message === "Comment not found."
        ? 404
        : message.includes("only modify") ||
            message.includes("permission")
          ? 403
          : 500;

    return NextResponse.json(
      { error: message },
      { status },
    );
  }
}