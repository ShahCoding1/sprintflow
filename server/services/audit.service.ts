import { auditRepository } from "@/server/repositories/audit.repository";
import { auditQuerySchema } from "@/features/audit/schemas/audit.schema";

export const auditService = {
  async list(
    organizationId: string,
    input: unknown,
  ) {
    const parsed = auditQuerySchema.safeParse(input);

    if (!parsed.success) {
      throw new Error("INVALID_AUDIT_QUERY");
    }

    const {
      page,
      limit,
      action,
      entityType,
      userId,
    } = parsed.data;

    const skip = (page - 1) * limit;

    const result = await auditRepository.findMany(
      {
        organizationId,
        action,
        entityType,
        userId,
      },
      skip,
      limit,
    );

    const totalPages =
      result.total === 0
        ? 0
        : Math.ceil(result.total / limit);

    return {
      items: result.items,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  },
};