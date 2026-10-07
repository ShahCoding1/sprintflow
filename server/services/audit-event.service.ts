import { activityRepository } from "@/server/repositories/activity.repository";

type AuditAction =
  | "CREATED"
  | "UPDATED"
  | "DELETED"
  | "ASSIGNED"
  | "UNASSIGNED"
  | "STATUS_CHANGED"
  | "PRIORITY_CHANGED"
  | "COMMENTED"
  | "MOVED"
  | "ADDED"
  | "REMOVED";

type AuditEventInput = {
  organizationId: string;
  userId?: string | null;
  taskId?: string | null;
  action: AuditAction;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown> | null;
};

export const auditEventService = {
  async record(data: AuditEventInput) {
    return activityRepository.create({
      organizationId: data.organizationId,
      userId: data.userId ?? null,
      taskId: data.taskId ?? null,
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId,
      metadata: data.metadata ?? null,
    });
  },

  async recordCreated(data: Omit<AuditEventInput, "action">) {
    return this.record({
      ...data,
      action: "CREATED",
    });
  },

  async recordUpdated(data: Omit<AuditEventInput, "action">) {
    return this.record({
      ...data,
      action: "UPDATED",
    });
  },

  async recordDeleted(data: Omit<AuditEventInput, "action">) {
    return this.record({
      ...data,
      action: "DELETED",
    });
  },

  async recordAdded(data: Omit<AuditEventInput, "action">) {
    return this.record({
      ...data,
      action: "ADDED",
    });
  },

  async recordRemoved(data: Omit<AuditEventInput, "action">) {
    return this.record({
      ...data,
      action: "REMOVED",
    });
  },
};