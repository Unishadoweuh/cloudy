import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

interface DiscordProfile {
    id: string;
    username: string;
    email?: string;
    avatar?: string;
}

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) { }

    async findOrCreateDiscordUser(profile: DiscordProfile) {
        // Check if user exists
        let user = await this.prisma.user.findUnique({
            where: { discordId: profile.id },
        });

        if (!user) {
            // Check if this is the first user (will be admin)
            const userCount = await this.prisma.user.count();
            const isFirstUser = userCount === 0;

            this.logger.log(`Creating new user: ${profile.username} (admin: ${isFirstUser})`);

            user = await this.prisma.user.create({
                data: {
                    discordId: profile.id,
                    username: profile.username,
                    email: profile.email,
                    avatar: profile.avatar ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png` : null,
                    role: isFirstUser ? 'ADMIN' : 'USER',
                },
            });
        } else {
            // Update user info
            user = await this.prisma.user.update({
                where: { id: user.id },
                data: {
                    username: profile.username,
                    email: profile.email,
                    avatar: profile.avatar ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png` : null,
                },
            });
        }

        return user;
    }

    async generateJwt(user: any) {
        const payload = {
            sub: user.id,
            discordId: user.discordId,
            username: user.username,
            role: user.role,
        };
        return this.jwtService.sign(payload);
    }

    async validateUserById(userId: string) {
        return this.prisma.user.findUnique({
            where: { id: userId },
        });
    }

    async getAllUsers() {
        return this.prisma.user.findMany({
            orderBy: { createdAt: 'asc' },
            select: {
                id: true,
                discordId: true,
                username: true,
                email: true,
                avatar: true,
                role: true,
                createdAt: true,
            },
        });
    }

    async updateUserRole(userId: string, role: 'USER' | 'ADMIN') {
        return this.prisma.user.update({
            where: { id: userId },
            data: { role },
        });
    }

    async updateUserLimits(id: string, limits: { maxCpu: number; maxMemory: number; maxDisk: number; maxInstances: number; allowedNodes: string[] }) {
        return this.prisma.user.update({
            where: { id },
            data: limits,
        });
    }

    async deleteUser(id: string) {
        return this.prisma.user.delete({
            where: { id },
        });
    }
}
