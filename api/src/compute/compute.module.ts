import { Module } from '@nestjs/common';
import { ComputeController } from './compute.controller';
import { ProxmoxModule } from '../proxmox/proxmox.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { BillingModule } from '../billing/billing.module';
import { AuditModule } from '../audit/audit.module';
import { SharingModule } from '../sharing/sharing.module';

@Module({
    imports: [ProxmoxModule, NotificationsModule, BillingModule, AuditModule, SharingModule],
    controllers: [ComputeController],
})
export class ComputeModule { }
