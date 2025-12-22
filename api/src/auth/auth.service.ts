import { Injectable, Logger, BadRequestException, UnauthorizedException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { MailService } from '../mail/mail.service';
import { AppConfigService } from '../app-config/app-config.service';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

interface DiscordProfile {
    id: string;
    username: string;
    email?: string;
    avatar?: string;
}

@Injectable()
export class AuthService implements OnModuleInit {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
        private mailService: MailService,
        private configService: AppConfigService,
    ) { }

    async onModuleInit() {
        await this.createDefaultAdmin();
    }

    private async createDefaultAdmin() {
        const userCount = await this.prisma.user.count();
        if (userCount === 0) {
            this.logger.log('Creating default admin user...');
            const hashedPassword = await bcrypt.hash('admin', 10);
            await this.prisma.user.create({
                data: {
                    username: 'admin',
                    email: 'admin@localhost',
                    password: hashedPassword,
                    role: 'ADMIN',
                    emailVerified: true,
                    mustChangePassword: true,
                },
            });
            this.logger.log('Default admin created: admin / admin');
        }
    }

    // ==================== EMAIL AUTH ====================

    async register(username: string, email: string, password: string, frontendUrl: string) {
        // Check if local auth is enabled
        const config = await this.configService.getConfig();
        if (!config.enableLocalAuth) {
            throw new BadRequestException('Local authentication is disabled');
        }

        // Check if email already exists
        const existingUser = await this.prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            throw new BadRequestException('Email already registered');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await this.prisma.user.create({
            data: {
                username,
                email,
                password: hashedPassword,
                emailVerified: !config.requireEmailVerification,
            },
        });

        // Send verification email if required
        if (config.requireEmailVerification) {
            const token = randomBytes(32).toString('hex');
            const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

            await this.prisma.emailVerification.create({
                data: {
                    userId: user.id,
                    token,
                    type: 'EMAIL_VERIFY',
                    expiresAt,
                },
            });

            await this.mailService.sendVerificationEmail(email, username, token, frontendUrl);
        }

        return { message: 'Registration successful. Please check your email to verify your account.' };
    }

    async login(email: string, password: string) {
        // Check if local auth is enabled
        const config = await this.configService.getConfig();
        if (!config.enableLocalAuth) {
            throw new BadRequestException('Local authentication is disabled');
        }

        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user || !user.password) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            throw new UnauthorizedException('Invalid credentials');
        }

        if (config.requireEmailVerification && !user.emailVerified) {
            throw new UnauthorizedException('Please verify your email before logging in');
        }

        const token = await this.generateJwt(user);
        return {
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                mustChangePassword: user.mustChangePassword,
            },
        };
    }

    async verifyEmail(token: string) {
        const verification = await this.prisma.emailVerification.findUnique({
            where: { token },
            include: { user: true },
        });

        if (!verification) {
            throw new BadRequestException('Invalid verification token');
        }

        if (verification.expiresAt < new Date()) {
            await this.prisma.emailVerification.delete({ where: { id: verification.id } });
            throw new BadRequestException('Verification token expired');
        }

        if (verification.type !== 'EMAIL_VERIFY') {
            throw new BadRequestException('Invalid token type');
        }

        await this.prisma.user.update({
            where: { id: verification.userId },
            data: { emailVerified: true },
        });

        await this.prisma.emailVerification.delete({ where: { id: verification.id } });

        return { message: 'Email verified successfully' };
    }

    async forgotPassword(email: string, frontendUrl: string) {
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user) {
            // Don't reveal if email exists
            return { message: 'If an account exists with this email, you will receive a password reset link.' };
        }

        const token = randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        // Delete any existing reset tokens
        await this.prisma.emailVerification.deleteMany({
            where: { userId: user.id, type: 'PASSWORD_RESET' },
        });

        await this.prisma.emailVerification.create({
            data: {
                userId: user.id,
                token,
                type: 'PASSWORD_RESET',
                expiresAt,
            },
        });

        await this.mailService.sendPasswordResetEmail(email, user.username, token, frontendUrl);

        return { message: 'If an account exists with this email, you will receive a password reset link.' };
    }

    async resetPassword(token: string, newPassword: string) {
        const verification = await this.prisma.emailVerification.findUnique({
            where: { token },
        });

        if (!verification || verification.type !== 'PASSWORD_RESET') {
            throw new BadRequestException('Invalid reset token');
        }

        if (verification.expiresAt < new Date()) {
            await this.prisma.emailVerification.delete({ where: { id: verification.id } });
            throw new BadRequestException('Reset token expired');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await this.prisma.user.update({
            where: { id: verification.userId },
            data: {
                password: hashedPassword,
                mustChangePassword: false,
            },
        });

        await this.prisma.emailVerification.delete({ where: { id: verification.id } });

        return { message: 'Password reset successfully' };
    }

    async changePassword(userId: string, currentPassword: string, newPassword: string) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.password) {
            throw new BadRequestException('Cannot change password for this account');
        }

        const isValid = await bcrypt.compare(currentPassword, user.password);
        if (!isValid) {
            throw new UnauthorizedException('Current password is incorrect');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                password: hashedPassword,
                mustChangePassword: false,
            },
        });

        return { message: 'Password changed successfully' };
    }

    // ==================== DISCORD AUTH ====================

    async isDiscordEnabled(): Promise<boolean> {
        const config = await this.configService.getConfig();
        return config.enableDiscordAuth;
    }

    async findOrCreateDiscordUser(profile: DiscordProfile) {
        // Check if Discord auth is enabled
        const config = await this.configService.getConfig();
        if (!config.enableDiscordAuth) {
            throw new BadRequestException('Discord authentication is disabled');
        }

        let user = await this.prisma.user.findUnique({
            where: { discordId: profile.id },
        });

        if (!user) {
            const userCount = await this.prisma.user.count();
            const isFirstUser = userCount === 0;

            this.logger.log(`Creating new Discord user: ${profile.username} (admin: ${isFirstUser})`);

            user = await this.prisma.user.create({
                data: {
                    discordId: profile.id,
                    username: profile.username,
                    email: profile.email,
                    avatar: profile.avatar ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png` : null,
                    role: isFirstUser ? 'ADMIN' : 'USER',
                    emailVerified: true, // Discord verifies email
                },
            });
        } else {
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

    // ==================== COMMON ====================

    async generateJwt(user: { id: string; discordId?: string | null; username: string; role: string }) {
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
                emailVerified: true,
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
