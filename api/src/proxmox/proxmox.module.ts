import { Module } from '@nestjs/common';
import { ProxmoxService } from './proxmox.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [ConfigModule, PrismaModule],
    providers: [ProxmoxService],
    exports: [ProxmoxService],
})
export class ProxmoxModule { }
