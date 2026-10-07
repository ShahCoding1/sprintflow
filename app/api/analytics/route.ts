import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { analyticsSchema } from "@/features/analytics/schemas/analytics.schema";
import { workspaceContextService } from "@/server/services/workspace-context.service";
import { analyticsAuthorizationService } from "@/server/services/analytics-authorization.service";
import { analyticsService } from "@/server/services/analytics.service";

export async function GET(
  request: Request,
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error: "Unauthorized.",
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
          error:
            "No workspace selected.",
        },
        {
          status: 400,
        },
      );
    }

    const url = new URL(request.url);

    const parsed =
      analyticsSchema.safeParse({
        projectId:
          url.searchParams.get(
            "projectId",
          ) ?? undefined,
        sprintId:
          url.searchParams.get(
            "sprintId",
          ) ?? undefined,
      });

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid analytics filters.",
          details:
            parsed.error.flatten(),
        },
        {
          status: 400,
        },
      );
    }

    await analyticsAuthorizationService.authorizeOrganizationMember(
      session.user.id,
      workspace.id,
    );

    if (parsed.data.projectId) {
      await analyticsAuthorizationService.authorizeProject(
        session.user.id,
        workspace.id,
        parsed.data.projectId,
      );
    }

    if (parsed.data.sprintId) {
      await analyticsAuthorizationService.authorizeSprint(
        session.user.id,
        workspace.id,
        parsed.data.sprintId,
      );
    }

    const analytics =
      await analyticsService.getAnalytics({
        organizationId:
          workspace.id,
        projectId:
          parsed.data.projectId,
        sprintId:
          parsed.data.sprintId,
      });

    return NextResponse.json(
      analytics,
    );
  } catch (error) {
    console.error(
      "Analytics GET error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load analytics.",
      },
      {
        status: 500,
      },
    );
  }
}