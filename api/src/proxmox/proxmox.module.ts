import { Module } from '@nestjs/common';
import { ProxmoxService } from './proxmox.service';
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [ConfigModule],
    providers: [ProxmoxService],
    exports: [ProxmoxService],
})
export class ProxmoxModule { }
