import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { organizationService } from "@/server/services/organization.service";

export async function GET() {
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

    const memberships = await organizationService.getUserOrganizations(
      session.user.id,
    );

    const organizations = memberships.map((membership) => ({
      id: membership.organization.id,
      name: membership.organization.name,
      slug: membership.organization.slug,
      description: membership.organization.description,
      role: membership.role,
    }));

    return NextResponse.json({
      success: true,
      organizations,
    });
  } catch (error) {
    console.error("Current organizations error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load organizations.",
      },
      { status: 500 },
    );
  }
}