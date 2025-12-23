import { Module } from '@nestjs/common';
import { SharingService } from './sharing.service';
import { SharingController } from './sharing.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
    imports: [PrismaModule, AuditModule],
    controllers: [SharingController],
    providers: [SharingService],
    exports: [SharingService],
})
export class SharingModule { }
