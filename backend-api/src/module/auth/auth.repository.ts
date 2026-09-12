import { prisma } from "../../config/prisma.js";
import { logExecution } from "../../shared/decorators/log.decorator.js";

export class AuthRepository {
    @logExecution()
    async findUserbyIdentifier(identifier: string) {
        return prisma.user.findFirst({
            where: {
                OR: [
                    { email: identifier },
                    { username: identifier }
                ]
            }
        });
    }

    @logExecution()
    async findUserByUsername(username: string) {
        return prisma.user.findUnique({
            where: { username }
        });
    }

    @logExecution()
    async findUserByEmail(email: string) {
        return prisma.user.findUnique({
            where: { email }
        });
    }

    @logExecution()
    async findUserById(id: number) {
        return prisma.user.findUnique({
            where: { id }
        });
    }

    @logExecution()
    async createUser(data: { username: string; email: string; passwordHash: string }) {
        return prisma.user.create({
            data: {
                username: data.username,
                passwordHash: data.passwordHash,
                email: data.email
            },
            select: {
                id: true,
                username: true,
                xpPoints: true,
                role: true,
                createdAt: true
            }
        });
    }

    @logExecution()
    async updateLastLogin(userId: number) {
        return prisma.user.update({
            where: { id: userId },
            data: { lastLoginDate: new Date() }
        });
    }

    @logExecution()
    async createRefreshToken(data: {
        userId: number;
        sessionId: string;
        tokenHash: string;
        deviceInfo?: string;
        expiresAt: Date;
    }) {
        return prisma.refreshToken.create({ data });
    }

    @logExecution()
    async findRefreshTokenByHash(tokenHash: string) {
        return prisma.refreshToken.findUnique({
            where: { tokenHash },
            include: { user: true }
        });
    }

    @logExecution()
    async revokeRefreshToken(tokenHash: string) {
        return prisma.refreshToken.update({
            where: { tokenHash },
            data: { isRevoked: true }
        });
    }

    @logExecution()
    async revokeAllSessionToken(sessionId: string) {
        return prisma.refreshToken.updateMany({
            where: { sessionId },
            data: { isRevoked: true }
        });
    }

    @logExecution()
    async createLoginLog(data: { userId: number; ipAddress?: string; deviceInfo?: string }) {
        return prisma.loginLog.create({
            data
        });
    }
}

export const authRepository = new AuthRepository();
