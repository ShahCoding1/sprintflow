import { z } from "zod";

export const createTimeEntrySchema = z.object({
  startedAt: z.coerce.date(),
  endedAt: z.coerce.date().nullable().optional(),
  durationSeconds: z
    .number()
    .int()
    .min(1)
    .max(86400)
    .nullable()
    .optional(),
  description: z
    .string()
    .trim()
    .max(1000, "Description cannot exceed 1000 characters.")
    .nullable()
    .optional(),
});

export const updateTimeEntrySchema = z.object({
  startedAt: z.coerce.date(),
  endedAt: z.coerce.date().nullable().optional(),
  durationSeconds: z
    .number()
    .int()
    .min(1)
    .max(86400)
    .nullable()
    .optional(),
  description: z
    .string()
    .trim()
    .max(1000, "Description cannot exceed 1000 characters.")
    .nullable()
    .optional(),
});

export const stopTimeEntrySchema = z.object({
  endedAt: z.coerce.date().optional(),
});

export type CreateTimeEntryInput = z.infer<typeof createTimeEntrySchema>;
export type UpdateTimeEntryInput = z.infer<typeof updateTimeEntrySchema>;
export type StopTimeEntryInput = z.infer<typeof stopTimeEntrySchema>;