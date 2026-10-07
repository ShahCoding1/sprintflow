import { taskDeletionRepository } from "@/server/repositories/task-deletion.repository";

export const taskDeletionService = {
  async deleteTask(data: {
    taskId: string;
    projectId: string;
    organizationId: string;
  }) {
    const task =
      await taskDeletionRepository.findTaskForDeletion(
        data.taskId,
        data.projectId,
        data.organizationId,
      );

    if (!task) {
      throw new Error("Task not found.");
    }

    await taskDeletionRepository.deleteTask(
      data.taskId,
    );

    return {
      id: task.id,
      title: task.title,
    };
  },
};