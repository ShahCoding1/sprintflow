import { z } from "zod";

export const deleteTaskSchema = z.object({});

export type DeleteTaskInput = z.infer<
  typeof deleteTaskSchema
>;