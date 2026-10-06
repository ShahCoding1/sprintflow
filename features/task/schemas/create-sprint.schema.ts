import { z } from "zod";

export const sprintStatusSchema = z.enum([
  "PLANNED",
  "ACTIVE",
  "COMPLETED",
]);

export const createSprintSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Sprint name must be at least 2 characters.")
      .max(100, "Sprint name cannot exceed 100 characters."),

    goal: z
      .string()
      .trim()
      .max(1000, "Sprint goal cannot exceed 1000 characters.")
      .nullable()
      .optional(),

    startDate: z.coerce.date().nullable().optional(),

    endDate: z.coerce.date().nullable().optional(),
  })
  .refine(
    (data) =>
      !data.startDate ||
      !data.endDate ||
      data.endDate >= data.startDate,
    {
      message: "End date must be on or after the start date.",
      path: ["endDate"],
    },
  );

export type CreateSprintInput = z.infer<
  typeof createSprintSchema
>;