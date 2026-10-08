"use client";

import {
  Download,
  File,
  FileArchive,
  FileImage,
  FileJson,
  FileSpreadsheet,
  FileText,
  Loader2,
  Paperclip,
  RefreshCw,
  Trash2,
  Upload,
} from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";

type AttachmentUser = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
};

type TaskAttachmentItem = {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  user: AttachmentUser;
};

type TaskAttachmentsProps = {
  projectId: string;
  taskId: string;
};

type AttachmentsResponse = {
  attachments?: TaskAttachmentItem[];
  message?: string;
};

function formatFileSize(sizeBytes: number) {
  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }

  if (sizeBytes < 1024 * 1024) {
    return `${(sizeBytes / 1024).toFixed(1)} KB`;
  }

  return `${(
    sizeBytes /
    (1024 * 1024)
  ).toFixed(1)} MB`;
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) {
    return FileImage;
  }

  if (
    mimeType === "application/pdf" ||
    mimeType === "text/plain" ||
    mimeType === "text/csv"
  ) {
    return FileText;
  }

  if (
    mimeType.includes("spreadsheet") ||
    mimeType.includes("excel")
  ) {
    return FileSpreadsheet;
  }

  if (mimeType.includes("json")) {
    return FileJson;
  }

  if (
    mimeType.includes("zip") ||
    mimeType.includes("compressed")
  ) {
    return FileArchive;
  }

  return File;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function TaskAttachments({
  projectId,
  taskId,
}: TaskAttachmentsProps) {
  const inputRef =
    useRef<HTMLInputElement>(null);

  const [attachments, setAttachments] =
    useState<TaskAttachmentItem[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [uploading, setUploading] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const [loaded, setLoaded] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [success, setSuccess] =
    useState<string | null>(null);

  const loadAttachments = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/projects/${projectId}/tasks/${taskId}/attachments`,
        {
          cache: "no-store",
        },
      );

      const result =
        (await response.json()) as AttachmentsResponse;

      if (!response.ok) {
        throw new Error(
          result.message ??
            "Unable to load attachments.",
        );
      }

      setAttachments(
        result.attachments ?? [],
      );
      setLoaded(true);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to load attachments.",
      );
    } finally {
      setLoading(false);
    }
  };

  const uploadFile = async (
    file: File,
  ) => {
    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();

      formData.append("file", file);

      const response = await fetch(
        `/api/projects/${projectId}/tasks/${taskId}/attachments`,
        {
          method: "POST",
          body: formData,
        },
      );

      const result =
        (await response.json()) as {
          attachment?: TaskAttachmentItem;
          message?: string;
        };

      if (!response.ok) {
        throw new Error(
          result.message ??
            "Unable to upload attachment.",
        );
      }

      if (result.attachment) {
        setAttachments((current) => [
          result.attachment!,
          ...current,
        ]);
      }

      setLoaded(true);
      setSuccess(
        "Attachment uploaded successfully.",
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to upload attachment.",
      );
    } finally {
      setUploading(false);

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    void uploadFile(file);
  };

  const deleteAttachment = async (
    attachmentId: string,
  ) => {
    const confirmed = window.confirm(
      "Delete this attachment?",
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(attachmentId);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(
        `/api/projects/${projectId}/tasks/${taskId}/attachments/${attachmentId}`,
        {
          method: "DELETE",
        },
      );

      const result =
        (await response.json()) as {
          message?: string;
        };

      if (!response.ok) {
        throw new Error(
          result.message ??
            "Unable to delete attachment.",
        );
      }

      setAttachments((current) =>
        current.filter(
          (attachment) =>
            attachment.id !== attachmentId,
        ),
      );

      setSuccess(
        "Attachment deleted successfully.",
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to delete attachment.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section
      className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6"
      aria-labelledby="task-attachments-heading"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <Paperclip className="size-5 shrink-0" />

          <div className="min-w-0">
            <h2
              id="task-attachments-heading"
              className="text-lg font-semibold"
            >
              Attachments
            </h2>

            <p className="text-sm text-muted-foreground">
              Upload files related to this task.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              void loadAttachments()
            }
            disabled={loading || uploading}
          >
            {loading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <RefreshCw />
            )}

            {loaded ? "Refresh" : "Load"}
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() =>
              inputRef.current?.click()
            }
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Upload />
            )}

            {uploading
              ? "Uploading..."
              : "Upload"}
          </Button>

          <input
            ref={inputRef}
            type="file"
            className="sr-only"
            onChange={handleFileChange}
            disabled={uploading}
            accept={[
              "image/jpeg",
              "image/png",
              "image/gif",
              "image/webp",
              "application/pdf",
              "text/plain",
              "text/csv",
              "application/json",
              "application/zip",
              ".docx",
              ".xlsx",
              ".pptx",
            ].join(",")}
          />
        </div>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        Maximum file size: 10 MB.
      </p>

      {error && (
        <div
          role="alert"
          className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      {success && (
        <div
          role="status"
          className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-400"
        >
          {success}
        </div>
      )}

      {!loaded && !loading && (
        <div className="mt-5 rounded-xl border border-dashed p-6 text-center">
          <Paperclip className="mx-auto size-7 text-muted-foreground" />

          <p className="mt-2 text-sm font-medium">
            No attachment list loaded
          </p>

          <p className="mt-1 text-sm text-muted-foreground">
            Load existing attachments or upload
            a new file.
          </p>
        </div>
      )}

      {loaded &&
        attachments.length === 0 && (
          <div className="mt-5 rounded-xl border border-dashed p-6 text-center">
            <Paperclip className="mx-auto size-7 text-muted-foreground" />

            <p className="mt-2 text-sm font-medium">
              No attachments yet
            </p>
          </div>
        )}

      {attachments.length > 0 && (
        <div className="mt-5 divide-y rounded-xl border">
          {attachments.map((attachment) => {
            const Icon = getFileIcon(
              attachment.mimeType,
            );

            return (
              <article
                key={attachment.id}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Icon className="size-5" />
                  </div>

                  <div className="min-w-0">
                    <p
                      className="truncate text-sm font-medium"
                      title={attachment.fileName}
                    >
                      {attachment.fileName}
                    </p>

                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(
                        attachment.sizeBytes,
                      )}{" "}
                      •{" "}
                      {formatDate(
                        attachment.createdAt,
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 gap-2">
                  <a
                    href={`/api/projects/${projectId}/tasks/${taskId}/attachments/${attachment.id}`}
                    className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-medium transition hover:bg-muted"
                  >
                    <Download className="size-4" />
                    Download
                  </a>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      void deleteAttachment(
                        attachment.id,
                      )
                    }
                    disabled={
                      deletingId ===
                      attachment.id
                    }
                    aria-label={`Delete ${attachment.fileName}`}
                  >
                    {deletingId ===
                    attachment.id ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <Trash2 />
                    )}
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}