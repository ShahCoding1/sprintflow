import { z } from "zod";

export const createTeamSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Team name must contain at least 2 characters.")
    .max(80, "Team name cannot exceed 80 characters."),

  description: z
    .string()
    .trim()
    .max(500, "Team description cannot exceed 500 characters.")
    .nullable()
    .optional(),
});

export const updateTeamSchema = createTeamSchema;

export type CreateTeamInput = z.infer<
  typeof createTeamSchema
>;

export type UpdateTeamInput = z.infer<
  typeof updateTeamSchema
>;