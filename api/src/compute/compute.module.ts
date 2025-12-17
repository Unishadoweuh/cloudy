import { Module } from '@nestjs/common';
import { ComputeController } from './compute.controller';
import { ProxmoxModule } from '../proxmox/proxmox.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { BillingModule } from '../billing/billing.module';

@Module({
    imports: [ProxmoxModule, NotificationsModule, BillingModule],
    controllers: [ComputeController],
})
export class ComputeModule { }
