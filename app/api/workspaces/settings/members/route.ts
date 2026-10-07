import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { workspaceContextService } from "@/server/services/workspace-context.service";
import { workspaceSettingsService } from "@/server/services/workspace-settings.service";

export async function GET() {
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
          message: "No active workspace selected.",
        },
        {
          status: 404,
        },
      );
    }

    const result =
      await workspaceSettingsService.getMembers(
        session.user.id,
        workspace.id,
      );

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to load workspace members.";

    return NextResponse.json(
      {
        message,
      },
      {
        status: message.includes("not a member")
          ? 404
          : 400,
      },
    );
  }
}