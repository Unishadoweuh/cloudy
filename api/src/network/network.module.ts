import { Module } from '@nestjs/common';
import { NetworkController } from './network.controller';
import { ProxmoxModule } from '../proxmox/proxmox.module';

@Module({
  imports: [ProxmoxModule],
  controllers: [NetworkController],
})
export class NetworkModule { }
