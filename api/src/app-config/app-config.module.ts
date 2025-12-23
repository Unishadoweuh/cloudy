import { Module, Global, forwardRef } from '@nestjs/common';
import { AppConfigService } from './app-config.service';
import { AppConfigController } from './app-config.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { MailModule } from '../mail/mail.module';
import { ProxmoxModule } from '../proxmox/proxmox.module';

@Global()
@Module({
    imports: [PrismaModule, forwardRef(() => MailModule), ProxmoxModule],
    controllers: [AppConfigController],
    providers: [AppConfigService],
    exports: [AppConfigService],
})
export class AppConfigModule { }

