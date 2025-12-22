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
        // Note: Discord OAuth can be configured via Admin Settings (DB) or env vars
        // Env vars are used for initial Passport setup as Passport requires config at construction time
        const clientID = configService.get<string>('DISCORD_CLIENT_ID') || 'not-configured';
        const clientSecret = configService.get<string>('DISCORD_CLIENT_SECRET') || 'not-configured';
        const callbackURL = configService.get<string>('DISCORD_CALLBACK_URL') || 'https://cp.unishadow.ovh/auth/discord/callback';

        super({
            clientID,
            clientSecret,
            callbackURL,
            scope: ['identify', 'email'],
        });

        if (clientID === 'not-configured') {
            this.logger.warn('Discord OAuth not configured. Configure in Admin Settings or set DISCORD_CLIENT_ID/SECRET env vars.');
        } else {
            this.logger.log('Discord OAuth configured via environment variables');
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

