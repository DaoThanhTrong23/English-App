// src/module/activity-log/activity-log.repository.ts
import { prisma } from "../../config/prisma.js";

export class ActivityLogRepository {
    async createLog(data: {
        userId?: number | null;
        actionType: string;
        description?: string;
    }) {
        return prisma.activityLog.create({
            data: {
                actionType: data.actionType,
                description: data.description,
                ...(data.userId ? { user: { connect: { id: data.userId } } } : {})
            }
        });
    }
}

export const activityLogRepository = new ActivityLogRepository();