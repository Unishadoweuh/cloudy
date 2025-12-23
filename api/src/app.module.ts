import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProxmoxModule } from './proxmox/proxmox.module';
import { ComputeModule } from './compute/compute.module';
import { StorageModule } from './storage/storage.module';
import { NetworkModule } from './network/network.module';
import { MonitoringModule } from './monitoring/monitoring.module';
import { SecurityModule } from './security/security.module';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PbsModule } from './pbs/pbs.module';
import { VncModule } from './vnc/vnc.module';
import { BillingModule } from './billing/billing.module';
import { AuditModule } from './audit/audit.module';
import { AppConfigModule } from './app-config/app-config.module';
import { MailModule } from './mail/mail.module';
import { SharingModule } from './sharing/sharing.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AppConfigModule, // Global - must be before AuthModule
    MailModule,      // Global - must be before AuthModule
    ProxmoxModule,
    ComputeModule,
    StorageModule,
    NetworkModule,
    MonitoringModule,
    SecurityModule,
    AuthModule,
    NotificationsModule,
    PbsModule,
    VncModule,
    BillingModule,
    AuditModule,
    SharingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }

