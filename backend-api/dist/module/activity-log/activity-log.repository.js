// src/module/activity-log/activity-log.repository.ts
import { prisma } from "../../config/prisma.js";
export class ActivityLogRepository {
    async createLog(data) {
        const payload = {
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
