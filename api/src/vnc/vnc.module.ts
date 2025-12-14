import { Module } from '@nestjs/common';
import { VncGateway } from './vnc.gateway';

@Module({
    providers: [VncGateway],
    exports: [VncGateway],
})
export class VncModule { }
