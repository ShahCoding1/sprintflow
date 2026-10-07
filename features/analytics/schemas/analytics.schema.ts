import { z } from "zod";

export const analyticsSchema = z.object({
  projectId: z.string().uuid("Invalid project ID.").optional(),
  sprintId: z.string().uuid("Invalid sprint ID.").optional(),
});

export type AnalyticsInput = z.infer<typeof analyticsSchema>;