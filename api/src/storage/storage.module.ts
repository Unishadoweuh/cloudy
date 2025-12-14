import { Module } from '@nestjs/common';
import { StorageController } from './storage.controller';
import { ProxmoxModule } from '../proxmox/proxmox.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [ProxmoxModule, NotificationsModule],
    controllers: [StorageController],
})
export class StorageModule { }
