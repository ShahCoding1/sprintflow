import { z } from "zod";

import {
  taskPrioritySchema,
  taskStatusSchema,
  taskTypeSchema,
} from "./create-task.schema";

export const updateTaskSchema = z
  .object({
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
      .nullable()
      .optional(),

    type: taskTypeSchema,

    status: taskStatusSchema,

    priority: taskPrioritySchema,

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

    position: z
      .number()
      .int("Position must be a whole number.")
      .min(0, "Position cannot be negative."),
  })
  .refine(
    (data) => {
      if (data.type === "SUBTASK" && !data.parentId) {
        return false;
      }

      return true;
    },
    {
      message: "A subtask must have a parent task.",
      path: ["parentId"],
    },
  );

export type UpdateTaskInput = z.infer<
  typeof updateTaskSchema
>;