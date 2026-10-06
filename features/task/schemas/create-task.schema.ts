import { z } from "zod";

export const taskTypeSchema = z.enum([
  "EPIC",
  "STORY",
  "TASK",
  "BUG",
  "SUBTASK",
]);

export const taskStatusSchema = z.enum([
  "TODO",
  "IN_PROGRESS",
  "IN_REVIEW",
  "DONE",
  "BLOCKED",
]);

export const taskPrioritySchema = z.enum([
  "LOW",
  "MEDIUM",
  "HIGH",
  "URGENT",
]);

export const createTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Task title must be at least 2 characters.")
    .max(200, "Task title must be less than 200 characters."),

  description: z
    .string()
    .trim()
    .max(
      5000,
      "Task description must be less than 5000 characters.",
    )
    .optional(),

  type: taskTypeSchema.default("TASK"),

  status: taskStatusSchema.default("TODO"),

  priority: taskPrioritySchema.default("MEDIUM"),

  sprintId: z
    .string()
    .uuid("Invalid sprint ID.")
    .nullable()
    .optional(),

  parentId: z
    .string()
    .uuid("Invalid parent task ID.")
    .nullable()
    .optional(),

  assigneeId: z
    .string()
    .uuid("Invalid assignee ID.")
    .nullable()
    .optional(),

  storyPoints: z
    .number()
    .int("Story points must be a whole number.")
    .min(0, "Story points cannot be negative.")
    .max(100, "Story points cannot exceed 100.")
    .nullable()
    .optional(),

  dueDate: z.coerce
    .date()
    .nullable()
    .optional(),
});

export type CreateTaskInput = z.infer<
  typeof createTaskSchema
>;