import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { taskAttachmentAuthorizationService } from "@/server/services/task-attachment-authorization.service";
import { taskAttachmentService } from "@/server/services/task-attachment.service";
import { workspaceContextService } from "@/server/services/workspace-context.service";

type RouteContext = {
  params: Promise<{
    projectId: string;
    taskId: string;
  }>;
};

export async function GET(
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

    const { projectId, taskId } = await params;

    const authorized =
      await taskAttachmentAuthorizationService.authorizeTaskAccess(
        {
          userId: session.user.id,
          organizationId: workspace.id,
          projectId,
          taskId,
          action: "VIEW",
        },
      );

    if (!authorized) {
      return NextResponse.json(
        { message: "Forbidden." },
        { status: 403 },
      );
    }

    const attachments =
      await taskAttachmentService.listByTask(
        taskId,
      );

    return NextResponse.json({
      attachments,
    });
  } catch (error) {
    console.error(
      "GET task attachments error:",
      error,
    );

    return NextResponse.json(
      {
        message:
          "Unable to load task attachments.",
      },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
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

    const { projectId, taskId } = await params;

    const authorized =
      await taskAttachmentAuthorizationService.authorizeTaskAccess(
        {
          userId: session.user.id,
          organizationId: workspace.id,
          projectId,
          taskId,
          action: "UPLOAD",
        },
      );

    if (!authorized) {
      return NextResponse.json(
        { message: "Forbidden." },
        { status: 403 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          message:
            "A file is required.",
        },
        { status: 400 },
      );
    }

    const attachment =
      await taskAttachmentService.upload({
        taskId,
        projectId,
        organizationId: workspace.id,
        userId: session.user.id,
        file,
      });

    return NextResponse.json(
      {
        attachment,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(
      "POST task attachment error:",
      error,
    );

    const message =
      error instanceof Error
        ? error.message
        : "";

    const errors: Record<
      string,
      {
        message: string;
        status: number;
      }
    > = {
      ATTACHMENT_TOO_LARGE: {
        message:
          "Attachment cannot exceed 10 MB.",
        status: 400,
      },
      UNSUPPORTED_ATTACHMENT_TYPE: {
        message:
          "This file type is not supported.",
        status: 400,
      },
      EMPTY_ATTACHMENT: {
        message:
          "The selected file is empty.",
        status: 400,
      },
      INVALID_ATTACHMENT: {
        message:
          "Invalid attachment.",
        status: 400,
      },
      INVALID_ATTACHMENT_NAME: {
        message:
          "Invalid attachment name.",
        status: 400,
      },
    };

    const mapped = errors[message];

    if (mapped) {
      return NextResponse.json(
        { message: mapped.message },
        { status: mapped.status },
      );
    }

    return NextResponse.json(
      {
        message:
          "Unable to upload attachment.",
      },
      { status: 500 },
    );
  }
}