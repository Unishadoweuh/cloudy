import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditAction, AuditCategory, AuditStatus, Prisma } from '@prisma/client';

export interface AuditLogInput {
    action: AuditAction;
    category: AuditCategory;
    status?: AuditStatus;
    userId?: string;
    username?: string;
    targetId?: string;
    targetName?: string;
    targetType?: string;
    details?: Record<string, any>;
    errorMessage?: string;
    ipAddress?: string;
    userAgent?: string;
}

export interface AuditLogFilters {
    category?: AuditCategory;
    action?: AuditAction;
    status?: AuditStatus;
    userId?: string;
    search?: string;
    dateFrom?: Date;
    dateTo?: Date;
}

export interface PaginationParams {
    page?: number;
    limit?: number;
}

@Injectable()
export class AuditService {
    private readonly logger = new Logger(AuditService.name);

    constructor(private prisma: PrismaService) { }

    /**
     * Create an audit log entry
     */
    async log(input: AuditLogInput): Promise<void> {
        try {
            await this.prisma.auditLog.create({
                data: {
                    action: input.action,
                    category: input.category,
                    status: input.status || AuditStatus.SUCCESS,
                    userId: input.userId,
                    username: input.username,
                    targetId: input.targetId,
                    targetName: input.targetName,
                    targetType: input.targetType,
                    details: input.details as Prisma.InputJsonValue,
                    errorMessage: input.errorMessage,
                    ipAddress: input.ipAddress,
                    userAgent: input.userAgent,
                },
            });
        } catch (error) {
            // Don't let audit logging failures break the main flow
            this.logger.error('Failed to create audit log', error);
        }
    }

    /**
     * Convenience method for logging errors
     */
    async logError(
        action: AuditAction,
        category: AuditCategory,
        errorMessage: string,
        input: Partial<AuditLogInput> = {},
    ): Promise<void> {
        await this.log({
            action,
            category,
            status: AuditStatus.ERROR,
            errorMessage,
            ...input,
        });
    }

    /**
     * Get audit logs with filters and pagination
     */
    async getLogs(
        filters: AuditLogFilters = {},
        pagination: PaginationParams = {},
    ) {
        const { page = 1, limit = 50 } = pagination;
        const skip = (page - 1) * limit;

        const where: Prisma.AuditLogWhereInput = {};

        if (filters.category) {
            where.category = filters.category;
        }

        if (filters.action) {
            where.action = filters.action;
        }

        if (filters.status) {
            where.status = filters.status;
        }

        if (filters.userId) {
            where.userId = filters.userId;
        }

        if (filters.search) {
            where.OR = [
                { targetName: { contains: filters.search, mode: 'insensitive' } },
                { username: { contains: filters.search, mode: 'insensitive' } },
                { targetId: { contains: filters.search, mode: 'insensitive' } },
            ];
        }

        if (filters.dateFrom || filters.dateTo) {
            where.createdAt = {};
            if (filters.dateFrom) {
                where.createdAt.gte = filters.dateFrom;
            }
            if (filters.dateTo) {
                where.createdAt.lte = filters.dateTo;
            }
        }

        const [logs, total] = await Promise.all([
            this.prisma.auditLog.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true,
                            avatar: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.auditLog.count({ where }),
        ]);

        return {
            logs,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Get audit log statistics for dashboard
     */
    async getStats() {
        const now = new Date();
        const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const [
            totalLogs,
            last24hCount,
            last7dCount,
            errorCount,
            byCategory,
            recentLogs,
        ] = await Promise.all([
            this.prisma.auditLog.count(),
            this.prisma.auditLog.count({
                where: { createdAt: { gte: last24h } },
            }),
            this.prisma.auditLog.count({
                where: { createdAt: { gte: last7d } },
            }),
            this.prisma.auditLog.count({
                where: { status: AuditStatus.ERROR },
            }),
            this.prisma.auditLog.groupBy({
                by: ['category'],
                _count: { category: true },
            }),
            this.prisma.auditLog.findMany({
                take: 10,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: { id: true, username: true, avatar: true },
                    },
                },
            }),
        ]);

        return {
            totalLogs,
            last24hCount,
            last7dCount,
            errorCount,
            byCategory: byCategory.reduce(
                (acc, item) => {
                    acc[item.category] = item._count.category;
                    return acc;
                },
                {} as Record<string, number>,
            ),
            recentLogs,
        };
    }

    /**
     * Delete old audit logs (for cleanup cron job)
     */
    async deleteOldLogs(olderThanDays: number = 180): Promise<number> {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

        const result = await this.prisma.auditLog.deleteMany({
            where: {
                createdAt: { lt: cutoffDate },
            },
        });

        this.logger.log(`Deleted ${result.count} audit logs older than ${olderThanDays} days`);
        return result.count;
    }
}
