import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { auditService } from "@/server/services/audit.service";
import { auditAuthorizationService } from "@/server/services/audit-authorization.service";
import { workspaceContextService } from "@/server/services/workspace-context.service";

export async function GET(request: Request) {
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
        {
          error:
            "Workspace context is required.",
        },
        { status: 400 },
      );
    }

    await auditAuthorizationService.authorizeView(
      workspace.id,
      session.user.id,
    );

    const url = new URL(request.url);

    const input = {
      page: url.searchParams.get("page") ?? undefined,
      limit: url.searchParams.get("limit") ?? undefined,
      action:
        url.searchParams.get("action") ?? undefined,
      entityType:
        url.searchParams.get("entityType") ?? undefined,
      userId:
        url.searchParams.get("userId") ?? undefined,
    };

    const result = await auditService.list(
      workspace.id,
      input,
    );

    return NextResponse.json(result);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message ===
        "WORKSPACE_MEMBERSHIP_REQUIRED"
    ) {
      return NextResponse.json(
        {
          error:
            "Workspace membership is required.",
        },
        { status: 403 },
      );
    }

    if (
      error instanceof Error &&
      error.message === "INVALID_AUDIT_QUERY"
    ) {
      return NextResponse.json(
        {
          error: "Invalid audit query.",
        },
        { status: 400 },
      );
    }

    console.error(
      "GET /api/audit failed:",
      error,
    );

    return NextResponse.json(
      {
        error: "Failed to load audit logs.",
      },
      { status: 500 },
    );
  }
}