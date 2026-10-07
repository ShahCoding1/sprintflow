import { prisma } from "@/lib/db";

type InvitationRole =
  | "OWNER"
  | "ADMIN"
  | "MEMBER"
  | "VIEWER";

export const invitationRepository = {
  findById(
    invitationId: string,
    organizationId: string,
  ) {
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
      where: { token },
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
        email: email.toLowerCase(),
        status: "PENDING",
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
        organizationId: true,
        userId: true,
        role: true,
      },
    });
  },

  findUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: {
        email: email.toLowerCase(),
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
    role: InvitationRole;
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
        status: "PENDING",
      },
      select: {
        id: true,
        organizationId: true,
        inviterId: true,
        email: true,
        role: true,
        status: true,
        token: true,
        expiresAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },

  async revoke(
    invitationId: string,
    organizationId: string,
  ) {
    const invitation = await prisma.invitation.findFirst({
      where: {
        id: invitationId,
        organizationId,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!invitation) {
      throw new Error("INVITATION_NOT_FOUND");
    }

    if (invitation.status !== "PENDING") {
      throw new Error("INVITATION_NOT_PENDING");
    }

    return prisma.invitation.update({
      where: {
        id: invitation.id,
      },
      data: {
        status: "REVOKED",
      },
      select: {
        id: true,
        organizationId: true,
        email: true,
        role: true,
        status: true,
        expiresAt: true,
        updatedAt: true,
      },
    });
  },

  async markExpired(invitationId: string) {
    return prisma.invitation.update({
      where: {
        id: invitationId,
      },
      data: {
        status: "EXPIRED",
      },
      select: {
        id: true,
        status: true,
      },
    });
  },

  async accept(
    invitationId: string,
    userId: string,
  ) {
    return prisma.$transaction(async (tx) => {
      const invitation =
        await tx.invitation.findUnique({
          where: {
            id: invitationId,
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
        user.email.toLowerCase() !==
        invitation.email.toLowerCase()
      ) {
        throw new Error(
          "INVITATION_EMAIL_MISMATCH",
        );
      }

      const existingMember =
        await tx.organizationMember.findUnique({
          where: {
            organizationId_userId: {
              organizationId:
                invitation.organizationId,
              userId: user.id,
            },
          },
          select: {
            id: true,
          },
        });

      if (existingMember) {
        throw new Error("USER_ALREADY_MEMBER");
      }

      const member =
        await tx.organizationMember.create({
          data: {
            organizationId:
              invitation.organizationId,
            userId: user.id,
            role: invitation.role,
          },
          select: {
            id: true,
            organizationId: true,
            userId: true,
            role: true,
          },
        });

      await tx.activityLog.create({
        data: {
          organizationId:
            invitation.organizationId,
          userId: user.id,
          taskId: null,
          action: "ADDED",
          entityType: "WORKSPACE_MEMBER",
          entityId: member.id,
          metadata: {
            targetUserId: user.id,
            role: member.role,
            source: "INVITATION_ACCEPTED",
            invitationId: invitation.id,
          },
        },
      });

      await tx.invitation.update({
        where: {
          id: invitation.id,
        },
        data: {
          status: "ACCEPTED",
        },
      });

      return member;
    });
  },
};