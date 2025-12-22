import { Controller, Get, Post, Patch, Body, UseGuards } from '@nestjs/common';
import { AppConfigService } from './app-config.service';
import { MailService } from '../mail/mail.service';
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
    constructor(
        private readonly configService: AppConfigService,
        private readonly mailService: MailService,
    ) { }

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

    // Test SMTP connection
    @Post('test-mail')
    @UseGuards(JwtAuthGuard, AdminGuard)
    async testMailConnection() {
        return this.mailService.testConnection();
    }

    // Send test email
    @Post('send-test-mail')
    @UseGuards(JwtAuthGuard, AdminGuard)
    async sendTestMail(@Body() body: { email: string }) {
        if (!body.email) {
            return { success: false, message: 'Email requis' };
        }
        return this.mailService.sendTestEmail(body.email);
    }
}
