import { Module } from '@nestjs/common';
import { MonitoringController } from './monitoring.controller';
import { ProxmoxModule } from '../proxmox/proxmox.module';

@Module({
    imports: [ProxmoxModule],
    controllers: [MonitoringController],
})
export class MonitoringModule { }
