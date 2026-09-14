// src/module/activity-log/activity-log.repository.ts
import { prisma } from "../../config/prisma.js";

export class ActivityLogRepository {
    async createLog(data: {
        userId?: number | null;
        actionType: string;
        description?: string;
    }) {
        const payload: any = {
            actionType: data.actionType,
            description: data.description,
        };
        if (data.userId) {
            payload.user = { connect: { id: data.userId } };
        }
        return prisma.activityLog.create({ data: payload });
    }
}

export const activityLogRepository = new ActivityLogRepository();