import { z } from "zod";

export const activityActionSchema = z.enum([
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
]);

export const activityQuerySchema = z.object({
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .default(50),
});

export type ActivityAction = z.infer<
  typeof activityActionSchema
>;