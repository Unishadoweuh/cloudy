import { Module } from '@nestjs/common';
import { ComputeController } from './compute.controller';
import { ProxmoxModule } from '../proxmox/proxmox.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [ProxmoxModule, NotificationsModule],
    controllers: [ComputeController],
})
export class ComputeModule { }
