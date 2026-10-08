import crypto from "node:crypto";
import path from "node:path";

import {
  allowedAttachmentTypes,
  attachmentMetadataSchema,
  MAX_ATTACHMENT_SIZE,
} from "@/features/attachments/schemas/attachment.schema";
import { attachmentStorage } from "@/lib/storage/attachment-storage";
import { activityService } from "@/server/services/activity.service";
import { taskAttachmentRepository } from "@/server/repositories/task-attachment.repository";

function sanitizeFileName(fileName: string) {
  const baseName = path.basename(fileName);

  const sanitized = baseName
    .replace(/[^\w.\- ()]/g, "_")
    .replace(/\s+/g, " ")
    .trim();

  return sanitized.slice(0, 255) || "attachment";
}

function getExtension(fileName: string) {
  const extension = path.extname(fileName);

  if (!extension) {
    return "";
  }

  return extension
    .replace(/[^a-zA-Z0-9.]/g, "")
    .toLowerCase()
    .slice(0, 20);
}

function createStorageKey(
  taskId: string,
  fileName: string,
) {
  const extension = getExtension(fileName);

  return path.posix.join(
    taskId,
    `${crypto.randomUUID()}${extension}`,
  );
}

export const taskAttachmentService = {
  async listByTask(taskId: string) {
    return taskAttachmentRepository.findByTask(
      taskId,
    );
  },

  async upload(data: {
    taskId: string;
    projectId: string;
    organizationId: string;
    userId: string;
    file: File;
  }) {
    if (!(data.file instanceof File)) {
      throw new Error("INVALID_ATTACHMENT");
    }

    if (!data.file.name.trim()) {
      throw new Error("INVALID_ATTACHMENT_NAME");
    }

    if (data.file.size < 1) {
      throw new Error("EMPTY_ATTACHMENT");
    }

    if (data.file.size > MAX_ATTACHMENT_SIZE) {
      throw new Error("ATTACHMENT_TOO_LARGE");
    }

    const mimeType =
      data.file.type?.trim().toLowerCase() ||
      "application/octet-stream";

    if (!allowedAttachmentTypes.has(mimeType)) {
      throw new Error("UNSUPPORTED_ATTACHMENT_TYPE");
    }

    const fileName = sanitizeFileName(
      data.file.name,
    );

    const metadata =
      attachmentMetadataSchema.safeParse({
        fileName,
        mimeType,
        sizeBytes: data.file.size,
      });

    if (!metadata.success) {
      throw new Error("INVALID_ATTACHMENT");
    }

    const storageKey = createStorageKey(
      data.taskId,
      fileName,
    );

    const buffer = Buffer.from(
      await data.file.arrayBuffer(),
    );

    await attachmentStorage.put(
      storageKey,
      buffer,
    );

    try {
      const attachment =
        await taskAttachmentRepository.create({
          taskId: data.taskId,
          userId: data.userId,
          fileName: metadata.data.fileName,
          storageKey,
          mimeType: metadata.data.mimeType,
          sizeBytes: metadata.data.sizeBytes,
        });

      try {
        await activityService.createTaskActivity({
          taskId: data.taskId,
          projectId: data.projectId,
          organizationId: data.organizationId,
          userId: data.userId,
          action: "ADDED",
          entityType: "TASK_ATTACHMENT",
          metadata: {
            attachmentId: attachment.id,
            fileName: attachment.fileName,
            mimeType: attachment.mimeType,
            sizeBytes: attachment.sizeBytes,
          },
        });
      } catch (activityError) {
        console.error(
          "Create attachment activity error:",
          activityError,
        );
      }

      return attachment;
    } catch (error) {
      await attachmentStorage.delete(storageKey);
      throw error;
    }
  },

  async get(attachmentId: string) {
    const attachment =
      await taskAttachmentRepository.findById(
        attachmentId,
      );

    if (!attachment) {
      throw new Error("ATTACHMENT_NOT_FOUND");
    }

    const buffer = await attachmentStorage.get(
      attachment.storageKey,
    );

    return {
      attachment,
      buffer,
    };
  },

  async delete(data: {
    attachmentId: string;
    projectId: string;
    organizationId: string;
    userId: string;
  }) {
    const attachment =
      await taskAttachmentRepository.findById(
        data.attachmentId,
      );

    if (!attachment) {
      throw new Error("ATTACHMENT_NOT_FOUND");
    }

    await taskAttachmentRepository.delete(
      data.attachmentId,
    );

    try {
      await attachmentStorage.delete(
        attachment.storageKey,
      );
    } catch (storageError) {
      console.error(
        "Delete attachment storage error:",
        storageError,
      );
    }

    try {
      await activityService.createTaskActivity({
        taskId: attachment.task.id,
        projectId: data.projectId,
        organizationId: data.organizationId,
        userId: data.userId,
        action: "REMOVED",
        entityType: "TASK_ATTACHMENT",
        metadata: {
          attachmentId: attachment.id,
          fileName: attachment.fileName,
        },
      });
    } catch (activityError) {
      console.error(
        "Create attachment deletion activity error:",
        activityError,
      );
    }

    return attachment;
  },
};