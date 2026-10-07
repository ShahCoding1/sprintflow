import { z } from "zod";

export const updateWorkspaceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Workspace name must contain at least 2 characters.")
    .max(80, "Workspace name cannot exceed 80 characters."),

  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2, "Workspace slug must contain at least 2 characters.")
    .max(80, "Workspace slug cannot exceed 80 characters.")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Workspace slug may contain lowercase letters, numbers, and single hyphens.",
    ),

  description: z
    .string()
    .trim()
    .max(500, "Workspace description cannot exceed 500 characters.")
    .nullable()
    .optional(),
});

export type UpdateWorkspaceInput = z.infer<
  typeof updateWorkspaceSchema
>;