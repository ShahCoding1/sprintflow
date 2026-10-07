import { randomBytes } from "node:crypto";

import { invitationRepository } from "@/server/repositories/invitation.repository";
import { invitationAuthorizationService } from "@/server/services/invitation-authorization.service";

const INVITATION_EXPIRY_DAYS = 7;

export const invitationService = {
  async list(organizationId: string) {
    const invitations =
      await invitationRepository.findByOrganization(
        organizationId,
      );

    const now = new Date();

    await Promise.all(
      invitations
        .filter(
          (invitation) =>
            invitation.status === "PENDING" &&
            invitation.expiresAt <= now,
        )
        .map((invitation) =>
          invitationRepository.markExpired(
            invitation.id,
          ),
        ),
    );

    return invitations.map((invitation) => {
      if (
        invitation.status === "PENDING" &&
        invitation.expiresAt <= now
      ) {
        return {
          ...invitation,
          status: "EXPIRED" as const,
        };
      }

      return invitation;
    });
  },

  async getByToken(token: string) {
    const invitation =
      await invitationRepository.findByToken(token);

    if (!invitation) {
      throw new Error("INVITATION_NOT_FOUND");
    }

    if (
      invitation.status === "PENDING" &&
      invitation.expiresAt <= new Date()
    ) {
      await invitationRepository.markExpired(
        invitation.id,
      );

      throw new Error("INVITATION_EXPIRED");
    }

    if (invitation.status !== "PENDING") {
      throw new Error("INVITATION_NOT_PENDING");
    }

    return invitation;
  },

  async create(
    organizationId: string,
    inviterId: string,
    input: {
      email: string;
      role: "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";
    },
  ) {
    const inviter =
      await invitationAuthorizationService.authorizeManage(
        organizationId,
        inviterId,
      );

    invitationAuthorizationService.authorizeRoleAssignment(
      inviter.role,
      input.role,
    );

    const email = input.email.trim().toLowerCase();

    const existingUser =
      await invitationRepository.findUserByEmail(
        email,
      );

    if (existingUser) {
      const existingMembership =
        await invitationRepository.findOrganizationMember(
          organizationId,
          existingUser.id,
        );

      if (existingMembership) {
        throw new Error("USER_ALREADY_MEMBER");
      }
    }

    const existingInvitation =
      await invitationRepository.findPendingByEmail(
        organizationId,
        email,
      );

    if (existingInvitation) {
      throw new Error(
        "INVITATION_ALREADY_PENDING",
      );
    }

    const token = randomBytes(32).toString("hex");

    const expiresAt = new Date();

    expiresAt.setDate(
      expiresAt.getDate() + INVITATION_EXPIRY_DAYS,
    );

    return invitationRepository.create({
      organizationId,
      inviterId,
      email,
      role: input.role,
      token,
      expiresAt,
    });
  },

  async revoke(
    organizationId: string,
    userId: string,
    invitationId: string,
  ) {
    await invitationAuthorizationService.authorizeManage(
      organizationId,
      userId,
    );

    return invitationRepository.revoke(
      invitationId,
      organizationId,
    );
  },

  async accept(
    invitationId: string,
    userId: string,
  ) {
    return invitationRepository.accept(
      invitationId,
      userId,
    );
  },
};