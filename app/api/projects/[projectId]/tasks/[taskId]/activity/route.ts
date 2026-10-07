import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { activityQuerySchema } from "@/features/activity/schemas/activity.schema";
import { activityAuthorizationService } from "@/server/services/activity-authorization.service";
import { activityService } from "@/server/services/activity.service";
import { workspaceContextService } from "@/server/services/workspace-context.service";

type RouteContext = {
  params: Promise<{
    projectId: string;
    taskId: string;
  }>;
};

export async function GET(
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
      await activityAuthorizationService.authorize({
        userId: session.user.id,
        organizationId: workspace.id,
        projectId,
        taskId,
        action: "VIEW",
      });

    if (!authorized) {
      return NextResponse.json(
        { message: "Forbidden." },
        { status: 403 },
      );
    }

    const { searchParams } =
      new URL(request.url);

    const parsed =
      activityQuerySchema.safeParse({
        limit:
          searchParams.get("limit") ?? undefined,
      });

    if (!parsed.success) {
      return NextResponse.json(
        {
          message:
            parsed.error.issues[0]?.message ??
            "Invalid query.",
        },
        { status: 400 },
      );
    }

    const activities =
      await activityService.getTaskActivity({
        taskId,
        projectId,
        organizationId: workspace.id,
        limit: parsed.data.limit,
      });

    return NextResponse.json({
      activities,
    });
  } catch (error) {
    console.error(
      "GET task activity error:",
      error,
    );

    return NextResponse.json(
      { message: "Unable to load task activity." },
      { status: 500 },
    );
  }
}