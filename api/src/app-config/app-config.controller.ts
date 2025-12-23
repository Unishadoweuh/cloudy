import { Controller, Get, Post, Patch, Body, UseGuards, Request, HttpException, HttpStatus } from '@nestjs/common';
import { AppConfigService } from './app-config.service';
import { MailService } from '../mail/mail.service';
import { ProxmoxService } from '../proxmox/proxmox.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

class UpdateConfigDto {
    // Setup Status
    setupCompleted?: boolean;
    // Proxmox
    pveHost?: string;
    pveTokenId?: string;
    pveTokenSecret?: string;
    // PBS
    pbsEnabled?: boolean;
    pbsHost?: string;
    pbsTokenId?: string;
    pbsTokenSecret?: string;
    // URLs
    frontendUrl?: string;
    apiUrl?: string;
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

class TestProxmoxDto {
    host: string;
    tokenId: string;
    tokenSecret: string;
}

class SetupDto {
    // Proxmox (required)
    pveHost: string;
    pveTokenId: string;
    pveTokenSecret: string;
    // URLs
    frontendUrl?: string;
    apiUrl?: string;
    // PBS (optional)
    pbsEnabled?: boolean;
    pbsHost?: string;
    pbsTokenId?: string;
    pbsTokenSecret?: string;
    // Auth Methods
    enableLocalAuth?: boolean;
    enableDiscordAuth?: boolean;
    // Discord OAuth (if enabled)
    discordClientId?: string;
    discordClientSecret?: string;
    discordCallbackUrl?: string;
    // SMTP (optional)
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
        private readonly proxmoxService: ProxmoxService,
    ) { }

    // Public endpoint - returns setup status
    @Get('setup-status')
    async getSetupStatus() {
        const config = await this.configService.getConfig();
        return {
            setupCompleted: config?.setupCompleted ?? false,
            hasConfig: !!config,
        };
    }

    // Public endpoint - test Proxmox connection (for setup wizard)
    @Post('test-proxmox')
    async testProxmoxConnection(@Body() data: TestProxmoxDto) {
        if (!data.host || !data.tokenId || !data.tokenSecret) {
            throw new HttpException('Missing required fields', HttpStatus.BAD_REQUEST);
        }
        return this.proxmoxService.testConnection(data.host, data.tokenId, data.tokenSecret);
    }

    // Public endpoint - complete initial setup (only works if setup not completed)
    @Post('setup')
    async completeSetup(@Body() data: SetupDto) {
        const config = await this.configService.getConfig();

        if (config?.setupCompleted) {
            throw new HttpException('Setup already completed', HttpStatus.FORBIDDEN);
        }

        // Validate required fields
        if (!data.pveHost || !data.pveTokenId || !data.pveTokenSecret) {
            throw new HttpException('Proxmox configuration is required', HttpStatus.BAD_REQUEST);
        }

        // Save all configuration
        const updateData: Record<string, unknown> = {
            setupCompleted: true,
            pveHost: data.pveHost,
            pveTokenId: data.pveTokenId,
            pveTokenSecret: data.pveTokenSecret,
            frontendUrl: data.frontendUrl || null,
            apiUrl: data.apiUrl || null,
            pbsEnabled: data.pbsEnabled ?? false,
            enableLocalAuth: data.enableLocalAuth ?? true,
            enableDiscordAuth: data.enableDiscordAuth ?? false,
        };

        // Optional PBS config
        if (data.pbsEnabled) {
            updateData.pbsHost = data.pbsHost;
            updateData.pbsTokenId = data.pbsTokenId;
            updateData.pbsTokenSecret = data.pbsTokenSecret;
        }

        // Optional Discord config
        if (data.enableDiscordAuth) {
            updateData.discordClientId = data.discordClientId;
            updateData.discordClientSecret = data.discordClientSecret;
            updateData.discordCallbackUrl = data.discordCallbackUrl;
        }

        // Optional SMTP config
        if (data.smtpHost) {
            updateData.smtpHost = data.smtpHost;
            updateData.smtpPort = data.smtpPort ?? 587;
            updateData.smtpSecure = data.smtpSecure ?? false;
            updateData.smtpUser = data.smtpUser;
            updateData.smtpPassword = data.smtpPassword;
            updateData.mailFrom = data.mailFrom;
        }

        await this.configService.updateConfig(updateData);

        // Reinitialize Proxmox client with new config
        await this.proxmoxService.reinitializeClient();

        return { success: true, message: 'Setup completed successfully' };
    }

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
            pveTokenSecret: config.pveTokenSecret ? '********' : null,
            pbsTokenSecret: config.pbsTokenSecret ? '********' : null,
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
