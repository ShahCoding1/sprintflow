import { z } from "zod";

export const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;

export const allowedAttachmentTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/json",
  "application/zip",
  "application/x-zip-compressed",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]);

export const attachmentMetadataSchema = z.object({
  fileName: z
    .string()
    .trim()
    .min(1, "File name is required.")
    .max(255, "File name cannot exceed 255 characters."),

  mimeType: z
    .string()
    .trim()
    .min(1, "File type is required.")
    .max(255),

  sizeBytes: z
    .number()
    .int()
    .positive()
    .max(
      MAX_ATTACHMENT_SIZE,
      "Attachment cannot exceed 10 MB.",
    ),
});

export type AttachmentMetadata = z.infer<
  typeof attachmentMetadataSchema
>;