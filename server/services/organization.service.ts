import { organizationRepository } from "@/server/repositories/organization.repository";

export const organizationService = {
  async createOrganization(data: {
    name: string;
    slug: string;
    description?: string;
    userId: string;
  }) {
    const existingOrganization =
      await organizationRepository.findBySlug(data.slug);

    if (existingOrganization) {
      throw new Error("An organization with this slug already exists.");
    }

    const organization = await organizationRepository.create({
      name: data.name,
      slug: data.slug,
      description: data.description,
    });

    await organizationRepository.addMember({
      organizationId: organization.id,
      userId: data.userId,
    });

    return organization;
  },

  async getUserOrganizations(userId: string) {
    return organizationRepository.findMembershipsByUserId(userId);
  },
};