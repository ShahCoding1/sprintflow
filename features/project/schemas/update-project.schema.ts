import { z } from "zod";

export const updateProjectSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Project name must be at least 2 characters.")
      .max(100, "Project name must be less than 100 characters."),

    key: z
      .string()
      .trim()
      .toUpperCase()
      .min(2, "Project key must be at least 2 characters.")
      .max(10, "Project key must be less than 10 characters.")
      .regex(
        /^[A-Z][A-Z0-9]*$/,
        "Project key must start with a letter and contain only letters and numbers.",
      ),

    description: z
      .string()
      .trim()
      .max(
        1000,
        "Project description must be less than 1000 characters.",
      )
      .optional(),

    status: z.enum([
      "PLANNING",
      "ACTIVE",
      "COMPLETED",
      "ARCHIVED",
    ]),

    startDate: z.coerce.date().nullable().optional(),

    endDate: z.coerce.date().nullable().optional(),
  })
  .refine(
    (data) => {
      if (!data.startDate || !data.endDate) {
        return true;
      }

      return data.endDate >= data.startDate;
    },
    {
      message: "End date must be on or after the start date.",
      path: ["endDate"],
    },
  );

export type UpdateProjectInput = z.infer<
  typeof updateProjectSchema
>;