import { Module } from '@nestjs/common';
import { SecurityController } from './security.controller';
import { ProxmoxModule } from '../proxmox/proxmox.module';

@Module({
    imports: [ProxmoxModule],
    controllers: [SecurityController],
})
export class SecurityModule { }
