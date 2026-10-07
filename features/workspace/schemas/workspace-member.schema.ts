import { z } from "zod";

export const workspaceMemberRoleSchema = z.enum([
  "OWNER",
  "ADMIN",
  "MEMBER",
  "VIEWER",
]);

export const updateWorkspaceMemberSchema = z.object({
  role: workspaceMemberRoleSchema,
});

export type UpdateWorkspaceMemberInput = z.infer<
  typeof updateWorkspaceMemberSchema
>;