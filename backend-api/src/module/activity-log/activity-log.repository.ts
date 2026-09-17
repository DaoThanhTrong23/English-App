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

    async findActivities(skip: number, take: number, search?: string, actionType?: string) {
        const where: any = {};
        if (actionType) {
            where.actionType = actionType;
        }
        if (search) {
            where.OR = [
                { user: { username: { contains: search } } },
                { user: { email: { contains: search } } },
                { description: { contains: search } }
            ];
        }

        const [total, items] = await Promise.all([
            prisma.activityLog.count({ where }),
            prisma.activityLog.findMany({
                where,
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

    async findLoginLogs(skip: number, take: number, search?: string) {
        const where: any = {};
        if (search) {
            where.OR = [
                { user: { username: { contains: search } } },
                { user: { email: { contains: search } } },
                { ipAddress: { contains: search } }
            ];
        }

        const [total, items] = await Promise.all([
            prisma.loginLog.count({ where }),
            prisma.loginLog.findMany({
                where,
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