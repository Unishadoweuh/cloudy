import { Module, Global } from '@nestjs/common';
import { AppConfigService } from './app-config.service';
import { AppConfigController } from './app-config.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Global()
@Module({
    imports: [PrismaModule],
    controllers: [AppConfigController],
    providers: [AppConfigService],
    exports: [AppConfigService],
})
export class AppConfigModule { }
