import {
  createTimeEntrySchema,
  updateTimeEntrySchema,
} from "@/features/time-tracking/schemas/time-entry.schema";
import { timeEntryRepository } from "@/server/repositories/time-entry.repository";

export const timeEntryService = {
  async listByTask(taskId: string) {
    return timeEntryRepository.findByTask(taskId);
  },

  async getActive(userId: string) {
    return timeEntryRepository.findActiveByUser(userId);
  },

  async start(data: {
    taskId: string;
    userId: string;
    startedAt?: Date;
    description?: string | null;
  }) {
    const existing = await timeEntryRepository.findActiveByUser(
      data.userId,
    );

    if (existing) {
      throw new Error("ACTIVE_TIMER_EXISTS");
    }

    const parsed = createTimeEntrySchema.safeParse({
      startedAt: data.startedAt ?? new Date(),
      endedAt: null,
      durationSeconds: null,
      description: data.description ?? null,
    });

    if (!parsed.success) {
      throw new Error("INVALID_TIME_ENTRY");
    }

    return timeEntryRepository.create({
      taskId: data.taskId,
      userId: data.userId,
      startedAt: parsed.data.startedAt,
      endedAt: null,
      durationSeconds: null,
      description: parsed.data.description ?? null,
    });
  },

  async stop(data: {
    entryId: string;
    endedAt?: Date;
  }) {
    const entry = await timeEntryRepository.findById(data.entryId);

    if (!entry) {
      throw new Error("TIME_ENTRY_NOT_FOUND");
    }

    if (entry.endedAt) {
      throw new Error("TIME_ENTRY_ALREADY_STOPPED");
    }

    const endedAt = data.endedAt ?? new Date();

    const durationSeconds = Math.floor(
      (endedAt.getTime() - entry.startedAt.getTime()) / 1000,
    );

    if (durationSeconds < 1) {
      throw new Error("INVALID_TIME_DURATION");
    }

    return timeEntryRepository.update(entry.id, {
      startedAt: entry.startedAt,
      endedAt,
      durationSeconds,
      description: entry.description,
    });
  },

  async createManual(data: {
    taskId: string;
    userId: string;
    startedAt: Date;
    endedAt: Date;
    description?: string | null;
  }) {
    const durationSeconds = Math.floor(
      (data.endedAt.getTime() - data.startedAt.getTime()) /
        1000,
    );

    if (durationSeconds < 1) {
      throw new Error("INVALID_TIME_DURATION");
    }

    const parsed = createTimeEntrySchema.safeParse({
      startedAt: data.startedAt,
      endedAt: data.endedAt,
      durationSeconds,
      description: data.description ?? null,
    });

    if (!parsed.success) {
      throw new Error("INVALID_TIME_ENTRY");
    }

    return timeEntryRepository.create({
      taskId: data.taskId,
      userId: data.userId,
      startedAt: parsed.data.startedAt,
      endedAt: parsed.data.endedAt,
      durationSeconds: parsed.data.durationSeconds,
      description: parsed.data.description ?? null,
    });
  },

  async update(data: {
    entryId: string;
    startedAt: Date;
    endedAt: Date | null;
    description?: string | null;
  }) {
    const durationSeconds = data.endedAt
      ? Math.floor(
          (data.endedAt.getTime() -
            data.startedAt.getTime()) /
            1000,
        )
      : null;

    const parsed = updateTimeEntrySchema.safeParse({
      startedAt: data.startedAt,
      endedAt: data.endedAt,
      durationSeconds,
      description: data.description ?? null,
    });

    if (!parsed.success) {
      throw new Error("INVALID_TIME_ENTRY");
    }

    return timeEntryRepository.update(data.entryId, {
      startedAt: parsed.data.startedAt,
      endedAt: parsed.data.endedAt,
      durationSeconds: parsed.data.durationSeconds,
      description: parsed.data.description ?? null,
    });
  },

  async delete(entryId: string) {
    return timeEntryRepository.delete(entryId);
  },
};