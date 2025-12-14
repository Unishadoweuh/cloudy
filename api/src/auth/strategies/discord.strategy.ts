import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-discord';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class DiscordStrategy extends PassportStrategy(Strategy, 'discord') {
    private readonly logger = new Logger(DiscordStrategy.name);

    constructor(
        private configService: ConfigService,
        private authService: AuthService,
    ) {
        const clientID = configService.get<string>('DISCORD_CLIENT_ID');
        const clientSecret = configService.get<string>('DISCORD_CLIENT_SECRET');
        const callbackURL = configService.get<string>('DISCORD_CALLBACK_URL') || 'https://cp.unishadow.ovh/auth/discord/callback';

        // Use dummy values if not configured (will fail at runtime but not during startup)
        super({
            clientID: clientID || 'not-configured',
            clientSecret: clientSecret || 'not-configured',
            callbackURL: callbackURL,
            scope: ['identify', 'email'],
        });

        if (!clientID || !clientSecret) {
            this.logger.warn('Discord OAuth not configured. Set DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET environment variables.');
        }
    }

    async validate(accessToken: string, refreshToken: string, profile: Profile) {
        this.logger.log(`Discord login: ${profile.username}`);

        const user = await this.authService.findOrCreateDiscordUser({
            id: profile.id,
            username: profile.username,
            email: profile.email,
            avatar: profile.avatar,
        });

        return user;
    }
}
