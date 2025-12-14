import { Controller, Get, Post, Patch, Delete, Param, UseGuards, Request, Body } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    @Get()
    findAll(@Request() req: any) {
        return this.notificationsService.findAll(req.user.userId);
    }

    @Patch(':id/read')
    markAsRead(@Param('id') id: string, @Request() req: any) {
        return this.notificationsService.markAsRead(id, req.user.userId);
    }

    @Patch('read-all')
    markAllAsRead(@Request() req: any) {
        return this.notificationsService.markAllAsRead(req.user.userId);
    }

    @Delete(':id')
    remove(@Param('id') id: string, @Request() req: any) {
        return this.notificationsService.delete(id, req.user.userId);
    }
}
