import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { AppConfigService } from './app-config.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

class UpdateConfigDto {
    enableLocalAuth?: boolean;
    enableDiscordAuth?: boolean;
    requireEmailVerification?: boolean;
    smtpHost?: string;
    smtpPort?: number;
    smtpSecure?: boolean;
    smtpUser?: string;
    smtpPassword?: string;
    mailFrom?: string;
}

@Controller('config')
export class AppConfigController {
    constructor(private readonly configService: AppConfigService) { }

    // Public endpoint - returns only auth method flags
    @Get('auth')
    async getAuthConfig() {
        return this.configService.getPublicConfig();
    }

    // Admin only - full config
    @Get()
    @UseGuards(JwtAuthGuard, AdminGuard)
    async getFullConfig() {
        const config = await this.configService.getConfig();
        // Don't expose smtp password
        return {
            ...config,
            smtpPassword: config.smtpPassword ? '********' : null,
        };
    }

    @Patch()
    @UseGuards(JwtAuthGuard, AdminGuard)
    async updateConfig(@Body() data: UpdateConfigDto) {
        // Filter undefined values
        const updateData: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(data)) {
            if (value !== undefined) {
                updateData[key] = value;
            }
        }
        return this.configService.updateConfig(updateData);
    }
}
