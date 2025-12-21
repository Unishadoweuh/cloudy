import { Controller, Get, UseGuards, Req, Res, Delete, Param, Patch, Body, Headers } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { AuditService } from '../audit/audit.service';
import { DiscordAuthGuard } from './guards/discord-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { AuditAction, AuditCategory } from '@prisma/client';

@Controller('auth')
export class AuthController {
    constructor(
        private authService: AuthService,
        private configService: ConfigService,
        private auditService: AuditService,
    ) { }

    @Get('discord')
    @UseGuards(DiscordAuthGuard)
    discordLogin() {
        // Redirects to Discord OAuth
    }

    @Get('discord/callback')
    @UseGuards(DiscordAuthGuard)
    async discordCallback(@Req() req: Request, @Res() res: Response) {
        const user = (req as any).user;
        const token = await this.authService.generateJwt(user);
        const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'https://cp.unishadow.ovh';

        // Log user login
        await this.auditService.log({
            action: AuditAction.USER_LOGIN,
            category: AuditCategory.AUTH,
            userId: user.id,
            username: user.username,
            details: { provider: 'discord' },
            ipAddress: req.ip || (req.headers['x-forwarded-for'] as string),
        });

        // Redirect to frontend with token
        res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
    }

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
            maxCpu: user.maxCpu,
            maxMemory: user.maxMemory,
            maxDisk: user.maxDisk,
            maxInstances: user.maxInstances,
            allowedNodes: user.allowedNodes,
        };
    }

    // Admin routes
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
            details: { newRole: body.role, previousRole: result.role !== body.role ? result.role : undefined },
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
            details: {
                maxCpu: body.maxCpu,
                maxMemory: body.maxMemory,
                maxDisk: body.maxDisk,
                maxInstances: body.maxInstances,
                allowedNodes: body.allowedNodes,
            },
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

        // Get user info before deletion for audit log
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
