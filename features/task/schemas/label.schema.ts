import { z } from "zod";

export const createLabelSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Label name is required.")
    .max(50, "Label name cannot exceed 50 characters."),

  color: z
    .string()
    .regex(
      /^#[0-9A-Fa-f]{6}$/,
      "Color must be a valid hexadecimal color.",
    ),
});

export const updateLabelSchema = createLabelSchema;

export type CreateLabelInput =
  z.infer<typeof createLabelSchema>;

export type UpdateLabelInput =
  z.infer<typeof updateLabelSchema>;