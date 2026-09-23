import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { organizationRepository } from "@/server/repositories/organization.repository";

const WORKSPACE_COOKIE_NAME = "sprintflow-workspace";

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required.",
        },
        { status: 401 },
      );
    }

    const body: unknown = await request.json();

    if (
      typeof body !== "object" ||
      body === null ||
      !("organizationId" in body) ||
      typeof body.organizationId !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "A valid organization ID is required.",
        },
        { status: 400 },
      );
    }

    const organizationId = body.organizationId.trim();

    if (!organizationId) {
      return NextResponse.json(
        {
          success: false,
          message: "A valid organization ID is required.",
        },
        { status: 400 },
      );
    }

    const membership =
      await organizationRepository.findMembershipByUserAndOrganization(
        session.user.id,
        organizationId,
      );

    if (!membership) {
      return NextResponse.json(
        {
          success: false,
          message: "You do not have access to this workspace.",
        },
        { status: 403 },
      );
    }

    const response = NextResponse.json({
      success: true,
      message: "Workspace selected successfully.",
      workspace: {
        id: membership.organization.id,
        name: membership.organization.name,
        slug: membership.organization.slug,
        role: membership.role,
      },
    });

    response.cookies.set({
      name: WORKSPACE_COOKIE_NAME,
      value: membership.organization.id,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (error) {
    console.error("Workspace selection error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to select workspace.",
      },
      { status: 500 },
    );
  }
}
