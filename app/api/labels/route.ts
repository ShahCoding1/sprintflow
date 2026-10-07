import { auth } from "@/auth";
import { NextResponse } from "next/server";

import { createLabelSchema } from "@/features/task/schemas/label.schema";
import { labelAuthorizationService } from "@/server/services/label-authorization.service";
import { labelService } from "@/server/services/label.service";
import { workspaceContextService } from "@/server/services/workspace-context.service";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 },
      );
    }

    const workspace =
      await workspaceContextService.getWorkspaceContext();

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace not selected." },
        { status: 400 },
      );
    }

    const labels =
      await labelService.getLabels(workspace.id);

    return NextResponse.json(labels);
  } catch (error) {
    console.error(
      "GET /api/labels failed:",
      error,
    );

    return NextResponse.json(
      { error: "Failed to load labels." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 },
      );
    }

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
      action: "CREATE",
    });

    const body = await request.json();

    const parsed =
      createLabelSchema.safeParse(body);

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
      await labelService.createLabel({
        organizationId: workspace.id,
        name: parsed.data.name,
        color: parsed.data.color,
      });

    return NextResponse.json(label, {
      status: 201,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to create label.";

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
      "POST /api/labels failed:",
      error,
    );

    return NextResponse.json(
      { error: "Failed to create label." },
      { status: 500 },
    );
  }
}