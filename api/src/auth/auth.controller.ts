import { Controller, Get, Post, UseGuards, Req, Res, Delete, Param, Patch, Body, Headers, Query, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { AuditService } from '../audit/audit.service';
import { AppConfigService } from '../app-config/app-config.service';
import { DiscordAuthGuard } from './guards/discord-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { AuditAction, AuditCategory } from '@prisma/client';

class RegisterDto {
    username!: string;
    email!: string;
    password!: string;
}

class LoginDto {
    email!: string;
    password!: string;
}

class ForgotPasswordDto {
    email!: string;
}

class ResetPasswordDto {
    token!: string;
    password!: string;
}

class ChangePasswordDto {
    currentPassword!: string;
    newPassword!: string;
}

@Controller('auth')
export class AuthController {
    constructor(
        private authService: AuthService,
        private configService: ConfigService,
        private auditService: AuditService,
        private appConfigService: AppConfigService,
    ) { }

    // ==================== EMAIL AUTH ====================

    @Post('register')
    async register(@Body() body: RegisterDto, @Req() req: Request) {
        const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'https://cp.unishadow.ovh';
        const result = await this.authService.register(body.username, body.email, body.password, frontendUrl);

        await this.auditService.log({
            action: AuditAction.USER_LOGIN,
            category: AuditCategory.AUTH,
            details: { type: 'registration', email: body.email },
            ipAddress: req.ip || (req.headers['x-forwarded-for'] as string),
        });

        return result;
    }

    @Post('login')
    async login(@Body() body: LoginDto, @Req() req: Request) {
        const result = await this.authService.login(body.email, body.password);

        await this.auditService.log({
            action: AuditAction.USER_LOGIN,
            category: AuditCategory.AUTH,
            userId: result.user.id,
            username: result.user.username,
            details: { provider: 'email' },
            ipAddress: req.ip || (req.headers['x-forwarded-for'] as string),
        });

        return result;
    }

    @Get('verify-email')
    async verifyEmail(@Query('token') token: string) {
        if (!token) {
            throw new BadRequestException('Token is required');
        }
        return this.authService.verifyEmail(token);
    }

    @Post('forgot-password')
    async forgotPassword(@Body() body: ForgotPasswordDto) {
        const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'https://cp.unishadow.ovh';
        return this.authService.forgotPassword(body.email, frontendUrl);
    }

    @Post('reset-password')
    async resetPassword(@Body() body: ResetPasswordDto) {
        return this.authService.resetPassword(body.token, body.password);
    }

    @Post('change-password')
    @UseGuards(JwtAuthGuard)
    async changePassword(@Body() body: ChangePasswordDto, @Req() req: Request) {
        const user = (req as any).user;
        return this.authService.changePassword(user.id, body.currentPassword, body.newPassword);
    }

    // ==================== DISCORD AUTH ====================

    @Get('discord')
    @UseGuards(DiscordAuthGuard)
    async discordLogin(@Res() res: Response) {
        // Check if Discord is enabled before redirecting
        const isEnabled = await this.authService.isDiscordEnabled();
        if (!isEnabled) {
            const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'https://cp.unishadow.ovh';
            return res.redirect(`${frontendUrl}/auth?error=discord_disabled`);
        }
        // Guard handles redirect
    }

    @Get('discord/callback')
    @UseGuards(DiscordAuthGuard)
    async discordCallback(@Req() req: Request, @Res() res: Response) {
        const user = (req as any).user;
        const token = await this.authService.generateJwt(user);
        const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'https://cp.unishadow.ovh';

        await this.auditService.log({
            action: AuditAction.USER_LOGIN,
            category: AuditCategory.AUTH,
            userId: user.id,
            username: user.username,
            details: { provider: 'discord' },
            ipAddress: req.ip || (req.headers['x-forwarded-for'] as string),
        });

        res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
    }

    // ==================== COMMON ====================

    @Get('me')
    @UseGuards(JwtAuthGuard)
    getProfile(@Req() req: Request) {
        const user = (req as any).user;
        return {
            id: user.id,
            discordId: user.discordId,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            role: user.role,
            emailVerified: user.emailVerified,
            mustChangePassword: user.mustChangePassword,
            maxCpu: user.maxCpu,
            maxMemory: user.maxMemory,
            maxDisk: user.maxDisk,
            maxInstances: user.maxInstances,
            allowedNodes: user.allowedNodes,
        };
    }

    // ==================== ADMIN ====================

    @Get('users')
    @UseGuards(JwtAuthGuard, AdminGuard)
    getAllUsers() {
        return this.authService.getAllUsers();
    }

    @Patch('users/:id/role')
    @UseGuards(JwtAuthGuard, AdminGuard)
    async updateUserRole(
        @Param('id') id: string,
        @Body() body: { role: 'USER' | 'ADMIN' },
        @Req() req: Request,
        @Headers('x-forwarded-for') forwardedFor?: string,
        @Headers('user-agent') userAgent?: string
    ) {
        const admin = (req as any).user;
        const result = await this.authService.updateUserRole(id, body.role);

        await this.auditService.log({
            action: AuditAction.UPDATE_USER_ROLE,
            category: AuditCategory.AUTH,
            userId: admin.id,
            username: admin.username,
            targetId: id,
            targetName: result.username,
            targetType: 'user',
            details: { newRole: body.role },
            ipAddress: forwardedFor || req.ip,
            userAgent,
        });

        return result;
    }

    @Patch('users/:id/limits')
    @UseGuards(JwtAuthGuard, AdminGuard)
    async updateUserLimits(
        @Param('id') id: string,
        @Body() body: { maxCpu: number; maxMemory: number; maxDisk: number; maxInstances: number; allowedNodes: string[] },
        @Req() req: Request,
        @Headers('x-forwarded-for') forwardedFor?: string,
        @Headers('user-agent') userAgent?: string
    ) {
        const admin = (req as any).user;
        const result = await this.authService.updateUserLimits(id, body);

        await this.auditService.log({
            action: AuditAction.UPDATE_USER_LIMITS,
            category: AuditCategory.AUTH,
            userId: admin.id,
            username: admin.username,
            targetId: id,
            targetName: result.username,
            targetType: 'user',
            details: body,
            ipAddress: forwardedFor || req.ip,
            userAgent,
        });

        return result;
    }

    @Delete('users/:id')
    @UseGuards(JwtAuthGuard, AdminGuard)
    async deleteUser(
        @Param('id') id: string,
        @Req() req: Request,
        @Headers('x-forwarded-for') forwardedFor?: string,
        @Headers('user-agent') userAgent?: string
    ) {
        const admin = (req as any).user;
        const userToDelete = await this.authService.validateUserById(id);
        const result = await this.authService.deleteUser(id);

        await this.auditService.log({
            action: AuditAction.DELETE_USER,
            category: AuditCategory.AUTH,
            userId: admin.id,
            username: admin.username,
            targetId: id,
            targetName: userToDelete?.username || 'Unknown',
            targetType: 'user',
            details: { deletedUsername: userToDelete?.username, deletedEmail: userToDelete?.email },
            ipAddress: forwardedFor || req.ip,
            userAgent,
        });

        return result;
    }
}
