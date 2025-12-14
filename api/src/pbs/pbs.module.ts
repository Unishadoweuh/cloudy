import { Module, forwardRef } from '@nestjs/common';
import { PbsService } from './pbs.service';
import { PbsController } from './pbs.controller';
import { ProxmoxModule } from '../proxmox/proxmox.module';

@Module({
    imports: [forwardRef(() => ProxmoxModule)],
    controllers: [PbsController],
    providers: [PbsService],
    exports: [PbsService],
})
export class PbsModule { }
