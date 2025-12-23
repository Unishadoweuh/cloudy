import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule, ScheduleModule.forRoot()],
    controllers: [BillingController],
    providers: [BillingService],
    exports: [BillingService]
})
export class BillingModule { }
