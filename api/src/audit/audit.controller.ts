import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { AuditService, AuditLogFilters, PaginationParams } from './audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuditCategory, AuditAction, AuditStatus } from '@prisma/client';

@Controller('audit')
@UseGuards(JwtAuthGuard)
export class AuditController {
    constructor(private readonly auditService: AuditService) { }

    /**
     * Get audit logs (admin only)
     */
    @Get('logs')
    async getLogs(
        @Request() req: any,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('category') category?: AuditCategory,
        @Query('action') action?: AuditAction,
        @Query('status') status?: AuditStatus,
        @Query('userId') userId?: string,
        @Query('search') search?: string,
        @Query('dateFrom') dateFrom?: string,
        @Query('dateTo') dateTo?: string,
    ) {
        // Check admin role
        if (req.user?.role !== 'ADMIN') {
            return { error: 'Unauthorized', statusCode: 403 };
        }

        const filters: AuditLogFilters = {
            category,
            action,
            status,
            userId,
            search,
            dateFrom: dateFrom ? new Date(dateFrom) : undefined,
            dateTo: dateTo ? new Date(dateTo) : undefined,
        };

        const pagination: PaginationParams = {
            page: page ? parseInt(page, 10) : 1,
            limit: limit ? Math.min(parseInt(limit, 10), 100) : 50,
        };

        return this.auditService.getLogs(filters, pagination);
    }

    /**
     * Get audit stats (admin only)
     */
    @Get('stats')
    async getStats(@Request() req: any) {
        // Check admin role
        if (req.user?.role !== 'ADMIN') {
            return { error: 'Unauthorized', statusCode: 403 };
        }

        return this.auditService.getStats();
    }
}
