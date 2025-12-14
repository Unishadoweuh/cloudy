import { Controller, Get, UseGuards, Req, Res, Delete, Param, Patch, Body } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { DiscordAuthGuard } from './guards/discord-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AdminGuard } from './guards/admin.guard';

@Controller('auth')
export class AuthController {
    constructor(
        private authService: AuthService,
        private configService: ConfigService,
    ) { }

    @Get('discord')
    @UseGuards(DiscordAuthGuard)
    discordLogin() {
        // Redirects to Discord OAuth
    }

    @Get('discord/callback')
    @UseGuards(DiscordAuthGuard)
    async discordCallback(@Req() req: Request, @Res() res: Response) {
        const token = await this.authService.generateJwt((req as any).user);
        const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'https://cp.unishadow.ovh';

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
    updateUserRole(@Param('id') id: string, @Body() body: { role: 'USER' | 'ADMIN' }) {
        return this.authService.updateUserRole(id, body.role);
    }

    @Patch('users/:id/limits')
    @UseGuards(JwtAuthGuard, AdminGuard)
    updateUserLimits(@Param('id') id: string, @Body() body: { maxCpu: number; maxMemory: number; maxDisk: number; maxInstances: number; allowedNodes: string[] }) {
        return this.authService.updateUserLimits(id, body);
    }

    @Delete('users/:id')
    @UseGuards(JwtAuthGuard, AdminGuard)
    deleteUser(@Param('id') id: string) {
        return this.authService.deleteUser(id);
    }
}
