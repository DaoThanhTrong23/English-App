var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { prisma } from "../../config/prisma.js";
import { logExecution } from "../../shared/decorators/log.decorator.js";
export class AuthRepository {
    async findUserbyIdentifier(identifier) {
        return prisma.user.findFirst({
            where: {
                OR: [
                    { email: identifier },
                    { username: identifier }
                ]
            }
        });
    }
    async findUserByUsername(username) {
        return prisma.user.findUnique({
            where: { username }
        });
    }
    async findUserByEmail(email) {
        return prisma.user.findUnique({
            where: { email }
        });
    }
    async findUserById(id) {
        return prisma.user.findUnique({
            where: { id }
        });
    }
    async createUser(data) {
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
    async updateLastLogin(userId) {
        return prisma.user.update({
            where: { id: userId },
            data: { lastLoginDate: new Date() }
        });
    }
    async createRefreshToken(data) {
        return prisma.refreshToken.create({ data });
    }
    async findRefreshTokenByHash(tokenHash) {
        return prisma.refreshToken.findUnique({
            where: { tokenHash },
            include: { user: true }
        });
    }
    async revokeRefreshToken(tokenHash) {
        return prisma.refreshToken.update({
            where: { tokenHash },
            data: { isRevoked: true }
        });
    }
    async revokeAllSessionToken(sessionId) {
        return prisma.refreshToken.updateMany({
            where: { sessionId },
            data: { isRevoked: true }
        });
    }
    async createLoginLog(data) {
        return prisma.loginLog.create({
            data
        });
    }
}
__decorate([
    logExecution(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuthRepository.prototype, "findUserbyIdentifier", null);
__decorate([
    logExecution(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuthRepository.prototype, "findUserByUsername", null);
__decorate([
    logExecution(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuthRepository.prototype, "findUserByEmail", null);
__decorate([
    logExecution(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AuthRepository.prototype, "findUserById", null);
__decorate([
    logExecution(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthRepository.prototype, "createUser", null);
__decorate([
    logExecution(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AuthRepository.prototype, "updateLastLogin", null);
__decorate([
    logExecution(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthRepository.prototype, "createRefreshToken", null);
__decorate([
    logExecution(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuthRepository.prototype, "findRefreshTokenByHash", null);
__decorate([
    logExecution(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuthRepository.prototype, "revokeRefreshToken", null);
__decorate([
    logExecution(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuthRepository.prototype, "revokeAllSessionToken", null);
__decorate([
    logExecution(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthRepository.prototype, "createLoginLog", null);
export const authRepository = new AuthRepository();
