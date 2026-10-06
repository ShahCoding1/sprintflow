import { z } from "zod";

export const moveTaskSchema = z.object({
  status: z.enum([
    "TODO",
    "IN_PROGRESS",
    "IN_REVIEW",
    "DONE",
    "BLOCKED",
  ]),
  position: z
    .number()
    .int("Position must be an integer.")
    .min(0, "Position cannot be negative."),
});

export type MoveTaskInput = z.infer<
  typeof moveTaskSchema
>;