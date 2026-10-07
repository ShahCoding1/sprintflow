import { prisma } from "@/lib/db";

export const invitationRepository = {
  findById(invitationId: string, organizationId: string) {
    return prisma.invitation.findFirst({
      where: {
        id: invitationId,
        organizationId,
      },
      select: {
        id: true,
        organizationId: true,
        inviterId: true,
        email: true,
        role: true,
        token: true,
        status: true,
        expiresAt: true,
        createdAt: true,
        updatedAt: true,
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
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

  findByToken(token: string) {
    return prisma.invitation.findUnique({
      where: {
        token,
      },
      select: {
        id: true,
        organizationId: true,
        inviterId: true,
        email: true,
        role: true,
        token: true,
        status: true,
        expiresAt: true,
        createdAt: true,
        updatedAt: true,
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
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
        email,
        status: "PENDING",
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        organizationId: true,
        email: true,
        role: true,
        status: true,
        expiresAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },

  findByOrganization(organizationId: string) {
    return prisma.invitation.findMany({
      where: {
        organizationId,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        organizationId: true,
        inviterId: true,
        email: true,
        role: true,
        status: true,
        expiresAt: true,
        createdAt: true,
        updatedAt: true,
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
      select: {
        id: true,
        role: true,
      },
    });
  },

  findUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });
  },

  create(data: {
    organizationId: string;
    inviterId: string;
    email: string;
    role: "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";
    token: string;
    expiresAt: Date;
  }) {
    return prisma.invitation.create({
      data: {
        organizationId: data.organizationId,
        inviterId: data.inviterId,
        email: data.email,
        role: data.role,
        token: data.token,
        expiresAt: data.expiresAt,
      },
      select: {
        id: true,
        organizationId: true,
        inviterId: true,
        email: true,
        role: true,
        status: true,
        expiresAt: true,
        createdAt: true,
        updatedAt: true,
        token: true,
      },
    });
  },

  revoke(
    invitationId: string,
    organizationId: string,
  ) {
    return prisma.invitation.updateMany({
      where: {
        id: invitationId,
        organizationId,
        status: "PENDING",
      },
      data: {
        status: "REVOKED",
      },
    });
  },

  markExpired(invitationId: string) {
    return prisma.invitation.updateMany({
      where: {
        id: invitationId,
        status: "PENDING",
      },
      data: {
        status: "EXPIRED",
      },
    });
  },

  accept(
    invitationId: string,
    userId: string,
  ) {
    return prisma.$transaction(async (tx) => {
      const invitation = await tx.invitation.findUnique({
        where: {
          id: invitationId,
        },
      });

      if (!invitation) {
        throw new Error("INVITATION_NOT_FOUND");
      }

      if (invitation.status !== "PENDING") {
        throw new Error("INVITATION_NOT_PENDING");
      }

      if (invitation.expiresAt <= new Date()) {
        await tx.invitation.update({
          where: {
            id: invitation.id,
          },
          data: {
            status: "EXPIRED",
          },
        });

        throw new Error("INVITATION_EXPIRED");
      }

      const user = await tx.user.findUnique({
        where: {
          id: userId,
        },
        select: {
          id: true,
          email: true,
        },
      });

      if (!user) {
        throw new Error("USER_NOT_FOUND");
      }

      if (
        user.email.trim().toLowerCase() !==
        invitation.email.trim().toLowerCase()
      ) {
        throw new Error("INVITATION_EMAIL_MISMATCH");
      }

      const existingMember =
        await tx.organizationMember.findUnique({
          where: {
            organizationId_userId: {
              organizationId: invitation.organizationId,
              userId,
            },
          },
        });

      if (existingMember) {
        if (existingMember.role !== invitation.role) {
          await tx.organizationMember.update({
            where: {
              id: existingMember.id,
            },
            data: {
              role: invitation.role,
            },
          });
        }
      } else {
        await tx.organizationMember.create({
          data: {
            organizationId: invitation.organizationId,
            userId,
            role: invitation.role,
          },
        });
      }

      const accepted = await tx.invitation.update({
        where: {
          id: invitation.id,
        },
        data: {
          status: "ACCEPTED",
        },
        select: {
          id: true,
          organizationId: true,
          email: true,
          role: true,
          status: true,
          expiresAt: true,
        },
      });

      return accepted;
    });
  },
};