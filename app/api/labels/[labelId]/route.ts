import { auth } from "@/auth";
import { NextResponse } from "next/server";

import { updateLabelSchema } from "@/features/task/schemas/label.schema";
import { labelAuthorizationService } from "@/server/services/label-authorization.service";
import { labelService } from "@/server/services/label.service";
import { workspaceContextService } from "@/server/services/workspace-context.service";

type LabelRouteContext = {
  params: Promise<{
    labelId: string;
  }>;
};

export async function PATCH(
  request: Request,
  { params }: LabelRouteContext,
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 },
      );
    }

    const { labelId } = await params;

    const workspace =
      await workspaceContextService.getWorkspaceContext();

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace not selected." },
        { status: 400 },
      );
    }

    await labelAuthorizationService.authorize({
      organizationId: workspace.id,
      userId: session.user.id,
      action: "UPDATE",
    });

    const body = await request.json();

    const parsed =
      updateLabelSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed.",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const label =
      await labelService.updateLabel({
        id: labelId,
        organizationId: workspace.id,
        name: parsed.data.name,
        color: parsed.data.color,
      });

    return NextResponse.json(label);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to update label.";

    if (message === "Label not found.") {
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

    if (message.includes("already exists")) {
      return NextResponse.json(
        { error: message },
        { status: 409 },
      );
    }

    console.error(
      "PATCH /api/labels/[labelId] failed:",
      error,
    );

    return NextResponse.json(
      { error: "Failed to update label." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: LabelRouteContext,
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 },
      );
    }

    const { labelId } = await params;

    const workspace =
      await workspaceContextService.getWorkspaceContext();

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace not selected." },
        { status: 400 },
      );
    }

    await labelAuthorizationService.authorize({
      organizationId: workspace.id,
      userId: session.user.id,
      action: "DELETE",
    });

    await labelService.deleteLabel({
      id: labelId,
      organizationId: workspace.id,
    });

    return new NextResponse(null, {
      status: 204,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to delete label.";

    if (message === "Label not found.") {
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
      "DELETE /api/labels/[labelId] failed:",
      error,
    );

    return NextResponse.json(
      { error: "Failed to delete label." },
      { status: 500 },
    );
  }
}