import { Controller, Get, Post, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { AppConfigService } from './app-config.service';
import { MailService } from '../mail/mail.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

class UpdateConfigDto {
    // Auth Methods
    enableLocalAuth?: boolean;
    enableDiscordAuth?: boolean;
    requireEmailVerification?: boolean;
    // Discord OAuth
    discordClientId?: string;
    discordClientSecret?: string;
    discordCallbackUrl?: string;
    // SMTP
    smtpHost?: string;
    smtpPort?: number;
    smtpSecure?: boolean;
    smtpUser?: string;
    smtpPassword?: string;
    mailFrom?: string;
    // Billing
    billingEnabled?: boolean;
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
        // Don't expose secrets
        return {
            ...config,
            smtpPassword: config.smtpPassword ? '********' : null,
            discordClientSecret: config.discordClientSecret ? '********' : null,
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

    // Send test email to the current user
    @Post('send-test-mail')
    @UseGuards(JwtAuthGuard, AdminGuard)
    async sendTestMail(@Request() req: any) {
        const userEmail = req.user?.email;
        if (!userEmail) {
            return { success: false, message: 'Email utilisateur non trouvé' };
        }
        return this.mailService.sendTestEmail(userEmail);
    }
}
