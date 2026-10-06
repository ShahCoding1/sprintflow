import { NextResponse } from "next/server";

import { workspaceContextService } from "@/server/services/workspace-context.service";
import { workspaceMemberService } from "@/server/services/workspace-member.service";

export async function GET() {
  try {
    const workspace =
      await workspaceContextService.getWorkspaceContext();

    if (!workspace) {
      return NextResponse.json(
        {
          success: false,
          message: "Workspace context is required.",
        },
        { status: 401 },
      );
    }

    const members =
      await workspaceMemberService.getWorkspaceMembers(
        workspace.id,
      );

    return NextResponse.json({
      success: true,
      members,
    });
  } catch (error) {
    console.error(
      "Get workspace members error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to retrieve workspace members.",
      },
      { status: 500 },
    );
  }
}