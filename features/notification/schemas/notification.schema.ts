import { z } from "zod";

export const notificationIdSchema = z.object({
  notificationId: z.string().uuid("Invalid notification ID."),
});

export const notificationListSchema = z.object({
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .default(50),

  unreadOnly: z
    .union([z.literal("true"), z.literal("false")])
    .optional()
    .transform((value) => value === "true"),
});

export type NotificationListInput = z.infer<
  typeof notificationListSchema
>;