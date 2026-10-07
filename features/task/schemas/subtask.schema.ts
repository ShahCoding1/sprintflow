import { z } from "zod";

export const subtaskPrioritySchema = z.enum([
  "LOW",
  "MEDIUM",
  "HIGH",
  "URGENT",
]);

export const subtaskStatusSchema = z.enum([
  "TODO",
  "IN_PROGRESS",
  "IN_REVIEW",
  "DONE",
  "BLOCKED",
]);

export const createSubtaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Subtask title must be at least 2 characters.")
    .max(200, "Subtask title cannot exceed 200 characters."),

  description: z
    .string()
    .trim()
    .max(5000, "Description cannot exceed 5000 characters.")
    .nullable()
    .optional(),

  priority: subtaskPrioritySchema.default("MEDIUM"),

  assigneeId: z
    .string()
    .uuid("Invalid assignee ID.")
    .nullable()
    .optional(),

  storyPoints: z
    .number()
    .int("Story points must be an integer.")
    .min(0, "Story points cannot be negative.")
    .max(100, "Story points cannot exceed 100.")
    .nullable()
    .optional(),

  dueDate: z
    .coerce
    .date()
    .nullable()
    .optional(),
});

export const updateSubtaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Subtask title must be at least 2 characters.")
    .max(200, "Subtask title cannot exceed 200 characters."),

  description: z
    .string()
    .trim()
    .max(5000, "Description cannot exceed 5000 characters.")
    .nullable()
    .optional(),

  status: subtaskStatusSchema,

  priority: subtaskPrioritySchema,

  assigneeId: z
    .string()
    .uuid("Invalid assignee ID.")
    .nullable()
    .optional(),

  storyPoints: z
    .number()
    .int("Story points must be an integer.")
    .min(0, "Story points cannot be negative.")
    .max(100, "Story points cannot exceed 100.")
    .nullable()
    .optional(),

  dueDate: z
    .coerce
    .date()
    .nullable()
    .optional(),

  position: z
    .number()
    .int("Position must be an integer.")
    .min(0, "Position cannot be negative."),
});

export type CreateSubtaskInput = z.infer<
  typeof createSubtaskSchema
>;

export type UpdateSubtaskInput = z.infer<
  typeof updateSubtaskSchema
>;