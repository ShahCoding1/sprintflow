import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { createOrganizationSchema } from "@/features/organization/schemas/create-organization.schema";
import { organizationService } from "@/server/services/organization.service";

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

    const parsed = createOrganizationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid organization data.",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const organization = await organizationService.createOrganization({
      ...parsed.data,
      userId: session.user.id,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Organization created successfully.",
        organization,
      },
      { status: 201 },
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "An organization with this slug already exists."
    ) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: 409 },
      );
    }

    console.error("Organization creation error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to create organization.",
      },
      { status: 500 },
    );
  }
}