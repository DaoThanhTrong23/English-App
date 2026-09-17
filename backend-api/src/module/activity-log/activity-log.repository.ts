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

    async findActivities(skip: number, take: number) {
        const [total, items] = await Promise.all([
            prisma.activityLog.count(),
            prisma.activityLog.findMany({
                skip,
                take,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: { select: { id: true, email: true, username: true } }
                }
            })
        ]);
        return { total, items };
    }

    async findLoginLogs(skip: number, take: number) {
        const [total, items] = await Promise.all([
            prisma.loginLog.count(),
            prisma.loginLog.findMany({
                skip,
                take,
                orderBy: { loginTime: 'desc' },
                include: {
                    user: { select: { id: true, email: true, username: true } }
                }
            })
        ]);
        return { total, items };
    }
}

export const activityLogRepository = new ActivityLogRepository();