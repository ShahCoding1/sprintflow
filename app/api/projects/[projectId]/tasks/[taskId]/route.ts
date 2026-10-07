import { NextResponse } from "next/server";

import { auth } from "@/auth";

import { auditEventService } from "@/server/services/audit-event.service";
import { taskDeletionAuthorizationService } from "@/server/services/task-deletion-authorization.service";
import { taskDeletionService } from "@/server/services/task-deletion.service";
import { workspaceContextService } from "@/server/services/workspace-context.service";

type RouteContext = {
  params: Promise<{
    projectId: string;
    taskId: string;
  }>;
};

export async function DELETE(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          message: "Unauthorized.",
        },
        {
          status: 401,
        },
      );
    }

    const workspace =
      await workspaceContextService.getWorkspaceContext();

    if (!workspace) {
      return NextResponse.json(
        {
          message: "Workspace not found.",
        },
        {
          status: 404,
        },
      );
    }

    const {
      projectId,
      taskId,
    } = await params;

    const authorized =
      await taskDeletionAuthorizationService.authorize({
        userId: session.user.id,
        organizationId: workspace.id,
        projectId,
        taskId,
      });

    if (!authorized) {
      return NextResponse.json(
        {
          message:
            "You do not have permission to delete this task.",
        },
        {
          status: 403,
        },
      );
    }

    const deleted =
      await taskDeletionService.deleteTask({
        taskId,
        projectId,
        organizationId: workspace.id,
      });

    await auditEventService.recordDeleted({
      organizationId: workspace.id,
      userId: session.user.id,
      taskId: null,
      entityType: "TASK",
      entityId: taskId,
      metadata: {
        title:
          deleted &&
          typeof deleted === "object" &&
          "title" in deleted
            ? deleted.title
            : undefined,
        projectId,
        deletedTaskId: taskId,
      },
    });

    return NextResponse.json({
      message: "Task deleted successfully.",
      task: deleted,
    });
  } catch (error) {
    console.error(
      "DELETE task error:",
      error,
    );

    if (
      error instanceof Error &&
      error.message === "Task not found."
    ) {
      return NextResponse.json(
        {
          message: error.message,
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json(
      {
        message: "Unable to delete task.",
      },
      {
        status: 500,
      },
    );
  }
}