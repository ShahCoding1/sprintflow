import { z } from "zod";

export const invitationRoleSchema = z.enum([
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
  role: invitationRoleSchema.default("MEMBER"),
});

export const invitationTokenSchema = z.object({
  token: z
    .string()
    .trim()
    .min(32, "Invalid invitation token.")
    .max(256, "Invalid invitation token."),
});

export type CreateInvitationInput = z.infer<
  typeof createInvitationSchema
>;