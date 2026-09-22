import { z } from "zod";

export const createOrganizationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Organization name must be at least 2 characters.")
    .max(100, "Organization name must be less than 100 characters."),

  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2, "Workspace slug must be at least 2 characters.")
    .max(50, "Workspace slug must be less than 50 characters.")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug can only contain lowercase letters, numbers, and hyphens.",
    ),

  description: z
    .string()
    .trim()
    .max(500, "Description must be less than 500 characters.")
    .optional(),
});

export type CreateOrganizationInput = z.infer<
  typeof createOrganizationSchema
>;