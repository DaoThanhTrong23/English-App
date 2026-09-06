import { prisma } from "../../config/prisma.js"

export const findUserbyIdentifier = (identifier: string) => {
    return prisma.user.findFirst({
        where: {
            OR: [
                { email: identifier },
                { username: identifier }
            ]
        }
    });
}

export const findUserByUsername = (username: string) => {
    return prisma.user.findUnique({where: {username: username}})
}

export const findUserByEmail = (email: string) => {
    return prisma.user.findUnique({where: {email: email}});
}

export const findUserById = (Id: number) => {
    return prisma.user.findUnique({where: {id: Id}});
}

export const createUser = (data: {username: string; email: string; passwordHash: string}) => {
    return prisma.user.create({
        data: {
            username: data.username,
            passwordHash: data.passwordHash,
            email: data.email
        },
        select: {
            id:true,
            username: true,
            xpPoints: true,
            role:true,
            createdAt: true
        }
    });
}


export const updateLastLogin = (userId: number) => {
    return prisma.user.update({
        where: {id: userId},
        data: {lastLoginDate: new Date() }
    })
}

export const createRefreshToken = (data: {
    userId: number;
    sessionId: string;
    tokenHash: string;
    deviceInfo?: string;
    expiresAt: Date;
}) => { return prisma.refreshToken.create({ data }); }


export const findRefreshTokenByHash = (tokenHash: string) => {
    return prisma.refreshToken.findUnique({
        where: {tokenHash: tokenHash},
        include: {user: true}
    });
}


export const revokeRefreshToken = (tokenHash: string) => {
    return prisma.refreshToken.update({
        where: {tokenHash: tokenHash}, 
        data: {isRevoked: true}
    });
}

export const revokeAllSessionToken = (sessionId: string) => {
    return prisma.refreshToken.updateMany({
        where: {sessionId: sessionId},
        data: {isRevoked: true}
    })
}

export const createLoginLog = (data: { userId: number; ipAddress?: string; deviceInfo?: string}) => {
    return prisma.loginLog.create({
        data,
    })
}

