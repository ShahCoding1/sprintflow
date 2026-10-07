import { prisma } from "@/lib/db";

export const invitationRepository = {
  findByOrganization(organizationId: string) {
    return prisma.invitation.findMany({
      where: {
        organizationId,
      },
      include: {
        inviter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  },

  findById(
    id: string,
    organizationId: string,
  ) {
    return prisma.invitation.findFirst({
      where: {
        id,
        organizationId,
      },
      include: {
        inviter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  },

  findByToken(token: string) {
    return prisma.invitation.findUnique({
      where: {
        token,
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        inviter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  },

  findPendingByEmail(
    organizationId: string,
    email: string,
  ) {
    return prisma.invitation.findFirst({
      where: {
        organizationId,
        email: email.toLowerCase(),
        status: "PENDING",
      },
    });
  },

  create(data: {
    organizationId: string;
    inviterId: string;
    email: string;
    role:
      | "OWNER"
      | "ADMIN"
      | "MEMBER"
      | "VIEWER";
    token: string;
    expiresAt: Date;
  }) {
    return prisma.invitation.create({
      data: {
        organizationId: data.organizationId,
        inviterId: data.inviterId,
        email: data.email.toLowerCase(),
        role: data.role,
        token: data.token,
        expiresAt: data.expiresAt,
      },
      include: {
        inviter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  },

  updateStatus(
    id: string,
    status:
      | "PENDING"
      | "ACCEPTED"
      | "REVOKED"
      | "EXPIRED",
  ) {
    return prisma.invitation.update({
      where: {
        id,
      },
      data: {
        status,
      },
    });
  },

  findOrganizationMember(
    organizationId: string,
    userId: string,
  ) {
    return prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
    });
  },

  createOrganizationMember(data: {
    organizationId: string;
    userId: string;
    role:
      | "OWNER"
      | "ADMIN"
      | "MEMBER"
      | "VIEWER";
  }) {
    return prisma.organizationMember.create({
      data,
    });
  },
};