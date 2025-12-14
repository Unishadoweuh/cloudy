import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
    constructor(private prisma: PrismaService) { }

    async findAll(userId: string) {
        return this.prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
    }

    async create(userId: string, title: string, message: string, type: string = 'info') {
        return this.prisma.notification.create({
            data: {
                userId,
                title,
                message,
                type,
            },
        });
    }

    async markAsRead(id: string, userId: string) {
        return this.prisma.notification.update({
            where: { id, userId },
            data: { read: true },
        });
    }

    async markAllAsRead(userId: string) {
        return this.prisma.notification.updateMany({
            where: { userId, read: false },
            data: { read: true },
        });
    }

    async delete(id: string, userId: string) {
        return this.prisma.notification.delete({
            where: { id, userId },
        });
    }
}
