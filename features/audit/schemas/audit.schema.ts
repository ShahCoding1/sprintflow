import { z } from "zod";

export const auditQuerySchema = z.object({
  page: z.coerce
    .number()
    .int()
    .min(1)
    .default(1),

  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .default(25),

  action: z
    .enum([
      "CREATED",
      "UPDATED",
      "DELETED",
      "ASSIGNED",
      "UNASSIGNED",
      "STATUS_CHANGED",
      "PRIORITY_CHANGED",
      "COMMENTED",
      "MOVED",
      "ADDED",
      "REMOVED",
    ])
    .optional(),

  entityType: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .optional(),

  userId: z
    .string()
    .uuid()
    .optional(),
});

export type AuditQueryInput = z.infer<
  typeof auditQuerySchema
>;