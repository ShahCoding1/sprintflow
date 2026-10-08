import { timeSummaryRepository } from "@/server/repositories/time-summary.repository";

type SummaryUser = {
  userId: string;
  name: string | null;
  email: string;
  durationSeconds: number;
  entryCount: number;
};

type SummaryTask = {
  taskId: string;
  title: string;
  durationSeconds: number;
  entryCount: number;
};

function buildSummary(
  entries: Awaited<
    ReturnType<typeof timeSummaryRepository.findProjectEntries>
  >,
) {
  let totalSeconds = 0;

  const users = new Map<string, SummaryUser>();
  const tasks = new Map<string, SummaryTask>();

  for (const entry of entries) {
    const duration = entry.durationSeconds ?? 0;

    totalSeconds += duration;

    const existingUser = users.get(entry.userId);

    if (existingUser) {
      existingUser.durationSeconds += duration;
      existingUser.entryCount += 1;
    } else {
      users.set(entry.userId, {
        userId: entry.userId,
        name: entry.userName,
        email: entry.userEmail,
        durationSeconds: duration,
        entryCount: 1,
      });
    }

    const existingTask = tasks.get(entry.taskId);

    if (existingTask) {
      existingTask.durationSeconds += duration;
      existingTask.entryCount += 1;
    } else {
      tasks.set(entry.taskId, {
        taskId: entry.taskId,
        title: entry.taskTitle,
        durationSeconds: duration,
        entryCount: 1,
      });
    }
  }

  return {
    totalSeconds,
    totalEntries: entries.length,
    activeEntries: entries.filter((entry) => !entry.endedAt).length,
    users: Array.from(users.values()).sort(
      (a, b) => b.durationSeconds - a.durationSeconds,
    ),
    tasks: Array.from(tasks.values()).sort(
      (a, b) => b.durationSeconds - a.durationSeconds,
    ),
    recentEntries: entries.slice(0, 20),
  };
}

export const timeSummaryService = {
  async getProjectSummary(
    projectId: string,
    organizationId: string,
  ) {
    const entries = await timeSummaryRepository.findProjectEntries(
      projectId,
      organizationId,
    );

    return buildSummary(entries);
  },

  async getUserSummary(
    projectId: string,
    organizationId: string,
    userId: string,
  ) {
    const entries = await timeSummaryRepository.findUserEntries(
      projectId,
      organizationId,
      userId,
    );

    const summary = buildSummary(entries);

    return {
      ...summary,
      user: entries[0]
        ? {
            userId: entries[0].userId,
            name: entries[0].userName,
            email: entries[0].userEmail,
          }
        : {
            userId,
            name: null,
            email: null,
          },
    };
  },
};