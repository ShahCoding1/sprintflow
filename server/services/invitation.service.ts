import crypto from "node:crypto";

import { prisma } from "@/lib/db";

import { invitationRepository } from "@/server/repositories/invitation.repository";
import { invitationAuthorizationService } from "@/server/services/invitation-authorization.service";

type OrganizationRole =
  | "OWNER"
  | "ADMIN"
  | "MEMBER"
  | "VIEWER";

function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

function getExpirationDate() {
  const expiresAt = new Date();

  expiresAt.setDate(
    expiresAt.getDate() + 7,
  );

  return expiresAt;
}

function isExpired(expiresAt: Date) {
  return expiresAt.getTime() <= Date.now();
}

export const invitationService = {
  async getInvitations(data: {
    organizationId: string;
    userId: string;
  }) {
    await invitationAuthorizationService.authorizeManage(
      data.organizationId,
      data.userId,
    );

    const invitations =
      await invitationRepository.findByOrganization(
        data.organizationId,
      );

    const now = new Date();

    const result = await Promise.all(
      invitations.map(async (invitation) => {
        if (
          invitation.status === "PENDING" &&
          invitation.expiresAt <= now
        ) {
          await invitationRepository.updateStatus(
            invitation.id,
            "EXPIRED",
          );

          return {
            ...invitation,
            status: "EXPIRED" as const,
          };
        }

        return invitation;
      }),
    );

    return result;
  },

  async createInvitation(data: {
    organizationId: string;
    inviterId: string;
    email: string;
    role: OrganizationRole;
  }) {
    await invitationAuthorizationService.authorizeInviteRole(
      data.organizationId,
      data.inviterId,
      data.role,
    );

    const email =
      data.email.trim().toLowerCase();

    const existingMember =
      await prisma.organizationMember.findFirst({
        where: {
          organizationId:
            data.organizationId,
          user: {
            email,
          },
        },
        select: {
          id: true,
        },
      });

    if (existingMember) {
      throw new Error(
        "This user is already a workspace member.",
      );
    }

    const existingInvitation =
      await invitationRepository.findPendingByEmail(
        data.organizationId,
        email,
      );

    if (existingInvitation) {
      if (
        isExpired(
          existingInvitation.expiresAt,
        )
      ) {
        await invitationRepository.updateStatus(
          existingInvitation.id,
          "EXPIRED",
        );
      } else {
        throw new Error(
          "A pending invitation already exists for this email.",
        );
      }
    }

    const token = generateToken();

    const invitation =
      await invitationRepository.create({
        organizationId:
          data.organizationId,
        inviterId: data.inviterId,
        email,
        role: data.role,
        token,
        expiresAt:
          getExpirationDate(),
      });

    const invitedUser =
      await prisma.user.findUnique({
        where: {
          email,
        },
        select: {
          id: true,
        },
      });

    if (
      invitedUser &&
      invitedUser.id !== data.inviterId
    ) {
      await prisma.notification.create({
        data: {
          userId: invitedUser.id,
          type: "ORGANIZATION_INVITATION",
          title: "Workspace invitation",
          message: `You have been invited to join ${invitation.email}'s workspace as ${data.role}.`,
        },
      });
    }

    await prisma.activityLog.create({
      data: {
        organizationId:
          data.organizationId,
        userId: data.inviterId,
        action: "CREATED",
        entityType: "Invitation",
        entityId: invitation.id,
        metadata: {
          email,
          role: data.role,
        },
      },
    });

    return {
      invitation,
      token,
    };
  },

  async getInvitationByToken(
    token: string,
  ) {
    const invitation =
      await invitationRepository.findByToken(
        token,
      );

    if (!invitation) {
      throw new Error(
        "Invitation not found.",
      );
    }

    if (
      invitation.status === "PENDING" &&
      isExpired(invitation.expiresAt)
    ) {
      await invitationRepository.updateStatus(
        invitation.id,
        "EXPIRED",
      );

      return {
        ...invitation,
        status: "EXPIRED" as const,
      };
    }

    return invitation;
  },

  async acceptInvitation(data: {
    token: string;
    userId: string;
    userEmail: string;
  }) {
    const invitation =
      await invitationRepository.findByToken(
        data.token,
      );

    if (!invitation) {
      throw new Error(
        "Invitation not found.",
      );
    }

    if (
      invitation.status !== "PENDING"
    ) {
      throw new Error(
        `This invitation is ${invitation.status.toLowerCase()}.`,
      );
    }

    if (
      isExpired(invitation.expiresAt)
    ) {
      await invitationRepository.updateStatus(
        invitation.id,
        "EXPIRED",
      );

      throw new Error(
        "This invitation has expired.",
      );
    }

    const normalizedUserEmail =
      data.userEmail.trim().toLowerCase();

    if (
      normalizedUserEmail !==
      invitation.email.toLowerCase()
    ) {
      throw new Error(
        "This invitation was issued for a different email address.",
      );
    }

    const existingMembership =
      await invitationRepository.findOrganizationMember(
        invitation.organizationId,
        data.userId,
      );

    if (existingMembership) {
      await invitationRepository.updateStatus(
        invitation.id,
        "ACCEPTED",
      );

      return {
        organizationId:
          invitation.organizationId,
        alreadyMember: true,
      };
    }

    const result =
      await prisma.$transaction(
        async (tx) => {
          const membership =
            await tx.organizationMember.create({
              data: {
                organizationId:
                  invitation.organizationId,
                userId: data.userId,
                role: invitation.role,
              },
            });

          const updatedInvitation =
            await tx.invitation.update({
              where: {
                id: invitation.id,
              },
              data: {
                status: "ACCEPTED",
              },
            });

          await tx.activityLog.create({
            data: {
              organizationId:
                invitation.organizationId,
              userId: data.userId,
              action: "ADDED",
              entityType: "OrganizationMember",
              entityId: membership.id,
              metadata: {
                invitationId:
                  invitation.id,
                role: invitation.role,
              },
            },
          });

          if (
            invitation.inviter.id !==
            data.userId
          ) {
            await tx.notification.create({
              data: {
                userId:
                  invitation.inviter.id,
                type:
                  "ORGANIZATION_INVITATION",
                title:
                  "Invitation accepted",
                message: `${data.userEmail} accepted your workspace invitation.`,
              },
            });
          }

          return {
            membership,
            invitation:
              updatedInvitation,
          };
        },
      );

    return {
      organizationId:
        invitation.organizationId,
      alreadyMember: false,
      ...result,
    };
  },

  async revokeInvitation(data: {
    organizationId: string;
    userId: string;
    invitationId: string;
  }) {
    const invitation =
      await invitationRepository.findById(
        data.invitationId,
        data.organizationId,
      );

    if (!invitation) {
      throw new Error(
        "Invitation not found.",
      );
    }

    await invitationAuthorizationService.authorizeRevoke(
      data.organizationId,
      data.userId,
      invitation.role,
    );

    if (invitation.status !== "PENDING") {
      throw new Error(
        "Only pending invitations can be revoked.",
      );
    }

    const updated =
      await invitationRepository.updateStatus(
        invitation.id,
        "REVOKED",
      );

    await prisma.activityLog.create({
      data: {
        organizationId:
          data.organizationId,
        userId: data.userId,
        action: "REMOVED",
        entityType: "Invitation",
        entityId: invitation.id,
        metadata: {
          email: invitation.email,
        },
      },
    });

    return updated;
  },
};