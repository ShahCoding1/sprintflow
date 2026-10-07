import { z } from "zod";

export const addTaskLabelSchema = z.object({
  labelId: z.string().uuid("Invalid label ID."),
});

export const removeTaskLabelSchema = z.object({
  labelId: z.string().uuid("Invalid label ID."),
});

export type AddTaskLabelInput = z.infer<
  typeof addTaskLabelSchema
>;

export type RemoveTaskLabelInput = z.infer<
  typeof removeTaskLabelSchema
>;