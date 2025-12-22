import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppConfig } from '@prisma/client';

@Injectable()
export class AppConfigService implements OnModuleInit {
    private readonly logger = new Logger(AppConfigService.name);
    private config: AppConfig | null = null;

    constructor(private readonly prisma: PrismaService) { }

    async onModuleInit() {
        await this.ensureConfigExists();
    }

    private async ensureConfigExists(): Promise<AppConfig> {
        let config = await this.prisma.appConfig.findUnique({
            where: { id: 'app_config' },
        });

        if (!config) {
            this.logger.log('Creating default app configuration...');
            config = await this.prisma.appConfig.create({
                data: {
                    id: 'app_config',
                    enableLocalAuth: true,
                    enableDiscordAuth: false,
                    requireEmailVerification: true,
                },
            });
        }

        this.config = config;
        return config;
    }

    async getConfig(): Promise<AppConfig> {
        if (!this.config) {
            this.config = await this.ensureConfigExists();
        }
        return this.config;
    }

    async getPublicConfig(): Promise<{
        enableLocalAuth: boolean;
        enableDiscordAuth: boolean;
        requireEmailVerification: boolean;
    }> {
        const config = await this.getConfig();
        return {
            enableLocalAuth: config.enableLocalAuth,
            enableDiscordAuth: config.enableDiscordAuth,
            requireEmailVerification: config.requireEmailVerification,
        };
    }

    async updateConfig(data: Partial<Omit<AppConfig, 'id' | 'updatedAt'>>): Promise<AppConfig> {
        this.config = await this.prisma.appConfig.update({
            where: { id: 'app_config' },
            data,
        });
        return this.config;
    }

    async isSmtpConfigured(): Promise<boolean> {
        const config = await this.getConfig();
        return !!(config.smtpHost && config.smtpUser && config.mailFrom);
    }
}
