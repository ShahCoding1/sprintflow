import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { taskAttachmentAuthorizationService } from "@/server/services/task-attachment-authorization.service";
import { taskAttachmentService } from "@/server/services/task-attachment.service";
import { workspaceContextService } from "@/server/services/workspace-context.service";

type RouteContext = {
  params: Promise<{
    projectId: string;
    taskId: string;
    attachmentId: string;
  }>;
};

export async function GET(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized.", {
        status: 401,
      });
    }

    const workspace =
      await workspaceContextService.getWorkspaceContext();

    if (!workspace) {
      return new NextResponse(
        "Workspace not found.",
        { status: 404 },
      );
    }

    const {
      projectId,
      taskId,
      attachmentId,
    } = await params;

    const access =
      await taskAttachmentAuthorizationService.authorizeAttachmentAccess(
        {
          userId: session.user.id,
          organizationId: workspace.id,
          attachmentId,
          action: "VIEW",
        },
      );

    if (
      !access.authorized ||
      !access.attachment ||
      access.attachment.task.projectId !== projectId
    ) {
      return new NextResponse("Forbidden.", {
        status: 403,
      });
    }

    const attachment =
      await taskAttachmentService.get(
        attachmentId,
      );

    if (
      attachment.attachment.task.id !== taskId
    ) {
      return new NextResponse("Not found.", {
        status: 404,
      });
    }

    const encodedFileName =
      encodeURIComponent(
        attachment.attachment.fileName,
      );

    return new NextResponse(
      new Uint8Array(attachment.buffer),
      {
        status: 200,
        headers: {
          "Content-Type":
            attachment.attachment.mimeType,
          "Content-Length":
            String(
              attachment.attachment.sizeBytes,
            ),
          "Content-Disposition":
            `attachment; filename*=UTF-8''${encodedFileName}`,
          "Cache-Control":
            "private, no-store",
          "X-Content-Type-Options":
            "nosniff",
        },
      },
    );
  } catch (error) {
    console.error(
      "GET attachment error:",
      error,
    );

    return new NextResponse(
      "Unable to download attachment.",
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized." },
        { status: 401 },
      );
    }

    const workspace =
      await workspaceContextService.getWorkspaceContext();

    if (!workspace) {
      return NextResponse.json(
        { message: "Workspace not found." },
        { status: 404 },
      );
    }

    const {
      projectId,
      taskId,
      attachmentId,
    } = await params;

    const access =
      await taskAttachmentAuthorizationService.authorizeAttachmentAccess(
        {
          userId: session.user.id,
          organizationId: workspace.id,
          attachmentId,
          action: "DELETE",
        },
      );

    if (!access.authorized) {
      return NextResponse.json(
        { message: "Forbidden." },
        { status: 403 },
      );
    }

    const attachment =
      await taskAttachmentService.get(
        attachmentId,
      );

    if (
      attachment.attachment.task.id !== taskId ||
      attachment.attachment.task.projectId !==
        projectId
    ) {
      return NextResponse.json(
        { message: "Attachment not found." },
        { status: 404 },
      );
    }

    await taskAttachmentService.delete({
      attachmentId,
      projectId,
      organizationId: workspace.id,
      userId: session.user.id,
    });

    return NextResponse.json({
      message:
        "Attachment deleted successfully.",
    });
  } catch (error) {
    console.error(
      "DELETE attachment error:",
      error,
    );

    if (
      error instanceof Error &&
      error.message ===
        "ATTACHMENT_NOT_FOUND"
    ) {
      return NextResponse.json(
        { message: "Attachment not found." },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        message:
          "Unable to delete attachment.",
      },
      { status: 500 },
    );
  }
}