import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { searchSchema } from "@/features/search/schemas/search.schema";
import { searchService } from "@/server/services/search.service";
import { workspaceContextService } from "@/server/services/workspace-context.service";

export async function GET(
  request: Request,
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          message: "Authentication required.",
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
          message: "Workspace context is required.",
        },
        {
          status: 400,
        },
      );
    }

    const url = new URL(request.url);

    const parsed = searchSchema.safeParse({
      q: url.searchParams.get("q") ?? "",
      limit:
        url.searchParams.get("limit") ??
        "20",
    });

    if (!parsed.success) {
      return NextResponse.json(
        {
          message:
            parsed.error.issues[0]?.message ??
            "Invalid search query.",
        },
        {
          status: 400,
        },
      );
    }

    const results =
      await searchService.search({
        organizationId: workspace.id,
        query: parsed.data.q,
        limit: parsed.data.limit,
      });

    return NextResponse.json(results);
  } catch (error) {
    console.error(
      "Global search failed:",
      error,
    );

    return NextResponse.json(
      {
        message: "Search failed.",
      },
      {
        status: 500,
      },
    );
  }
}