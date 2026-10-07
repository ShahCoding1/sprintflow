import { randomBytes } from "node:crypto";

import { invitationRepository } from "@/server/repositories/invitation.repository";

const INVITATION_EXPIRY_DAYS = 7;

function createToken() {
  return randomBytes(32).toString("hex");
}

function getExpiryDate() {
  const expiry = new Date();

  expiry.setDate(
    expiry.getDate() + INVITATION_EXPIRY_DAYS,
  );

  return expiry;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export const invitationService = {
  async list(organizationId: string) {
    const invitations =
      await invitationRepository.findByOrganization(
        organizationId,
      );

    const now = new Date();

    const results = await Promise.all(
      invitations.map(async (invitation) => {
        if (
          invitation.status === "PENDING" &&
          invitation.expiresAt <= now
        ) {
          await invitationRepository.markExpired(
            invitation.id,
          );

          return {
            ...invitation,
            status: "EXPIRED" as const,
          };
        }

        return invitation;
      }),
    );

    return results;
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

  async create(data: {
    organizationId: string;
    inviterId: string;
    email: string;
    role: "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";
  }) {
    const email = normalizeEmail(data.email);

    const existingUser =
      await invitationRepository.findUserByEmail(email);

    if (existingUser) {
      const existingMember =
        await invitationRepository.findOrganizationMember(
          data.organizationId,
          existingUser.id,
        );

      if (existingMember) {
        throw new Error("USER_ALREADY_MEMBER");
      }
    }

    const existingInvitation =
      await invitationRepository.findPendingByEmail(
        data.organizationId,
        email,
      );

    if (existingInvitation) {
      if (
        existingInvitation.expiresAt <= new Date()
      ) {
        await invitationRepository.markExpired(
          existingInvitation.id,
        );
      } else {
        throw new Error("INVITATION_ALREADY_PENDING");
      }
    }

    const invitation =
      await invitationRepository.create({
        organizationId: data.organizationId,
        inviterId: data.inviterId,
        email,
        role: data.role,
        token: createToken(),
        expiresAt: getExpiryDate(),
      });

    return invitation;
  },

  async revoke(
    invitationId: string,
    organizationId: string,
  ) {
    const invitation =
      await invitationRepository.findById(
        invitationId,
        organizationId,
      );

    if (!invitation) {
      throw new Error("INVITATION_NOT_FOUND");
    }

    if (invitation.status !== "PENDING") {
      throw new Error("INVITATION_NOT_PENDING");
    }

    const result =
      await invitationRepository.revoke(
        invitationId,
        organizationId,
      );

    if (result.count !== 1) {
      throw new Error("INVITATION_REVOKE_FAILED");
    }

    return {
      id: invitationId,
      status: "REVOKED" as const,
    };
  },

  async accept(
    token: string,
    userId: string,
  ) {
    const invitation =
      await invitationRepository.findByToken(token);

    if (!invitation) {
      throw new Error("INVITATION_NOT_FOUND");
    }

    if (invitation.status !== "PENDING") {
      throw new Error("INVITATION_NOT_PENDING");
    }

    if (invitation.expiresAt <= new Date()) {
      await invitationRepository.markExpired(
        invitation.id,
      );

      throw new Error("INVITATION_EXPIRED");
    }

    return invitationRepository.accept(
      invitation.id,
      userId,
    );
  },
};