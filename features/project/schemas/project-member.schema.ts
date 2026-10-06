import { z } from "zod";

export const projectMemberRoleSchema = z.enum([
  "MANAGER",
  "MEMBER",
  "VIEWER",
]);

export const addProjectMemberSchema = z.object({
  userId: z
    .string()
    .uuid("Invalid user ID."),

  role: projectMemberRoleSchema.default("MEMBER"),
});

export const updateProjectMemberSchema = z.object({
  role: projectMemberRoleSchema,
});

export type AddProjectMemberInput = z.infer<
  typeof addProjectMemberSchema
>;

export type UpdateProjectMemberInput = z.infer<
  typeof updateProjectMemberSchema
>;