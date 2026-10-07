import { z } from "zod";

export const organizationRoleSchema = z.enum([
  "OWNER",
  "ADMIN",
  "MEMBER",
  "VIEWER",
]);

export const createInvitationSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Enter a valid email address.")
    .max(320, "Email address is too long.")
    .transform((value) => value.toLowerCase()),

  role: organizationRoleSchema.default("MEMBER"),
});

export type CreateInvitationInput = z.infer<
  typeof createInvitationSchema
>;