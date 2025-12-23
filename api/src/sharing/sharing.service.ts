import { Injectable, Logger, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SharePermission } from '@prisma/client';

@Injectable()
export class SharingService {
    private readonly logger = new Logger(SharingService.name);

    constructor(private prisma: PrismaService) { }

    /**
     * Share an instance with another user
     */
    async shareInstance(
        ownerId: string,
        vmid: number,
        node: string,
        vmType: string,
        vmName: string,
        sharedWithEmail: string,
        permission: SharePermission = SharePermission.READONLY,
        expiresAt?: Date
    ) {
        // Find the user to share with
        const targetUser = await this.prisma.user.findUnique({
            where: { email: sharedWithEmail }
        });

        if (!targetUser) {
            throw new NotFoundException(`User with email ${sharedWithEmail} not found`);
        }

        if (targetUser.id === ownerId) {
            throw new BadRequestException('Cannot share an instance with yourself');
        }

        // Check if share already exists
        const existingShare = await this.prisma.instanceShare.findUnique({
            where: {
                vmid_node_sharedWithId: {
                    vmid,
                    node,
                    sharedWithId: targetUser.id
                }
            }
        });

        if (existingShare) {
            // Update existing share
            return this.prisma.instanceShare.update({
                where: { id: existingShare.id },
                data: {
                    permission,
                    expiresAt,
                    vmName
                }
            });
        }

        // Create new share
        return this.prisma.instanceShare.create({
            data: {
                vmid,
                node,
                vmType,
                vmName,
                ownerId,
                sharedWithId: targetUser.id,
                permission,
                expiresAt
            }
        });
    }

    /**
     * Revoke a share
     */
    async revokeShare(ownerId: string, shareId: string) {
        const share = await this.prisma.instanceShare.findUnique({
            where: { id: shareId }
        });

        if (!share) {
            throw new NotFoundException('Share not found');
        }

        if (share.ownerId !== ownerId) {
            throw new ForbiddenException('You can only revoke shares you created');
        }

        return this.prisma.instanceShare.delete({
            where: { id: shareId }
        });
    }

    /**
     * Get all instances that the user has shared with others
     */
    async getMyShares(ownerId: string) {
        const shares = await this.prisma.instanceShare.findMany({
            where: { ownerId },
            orderBy: { createdAt: 'desc' }
        });

        // Get user details for each share
        const sharesWithUsers = await Promise.all(
            shares.map(async (share) => {
                const user = await this.prisma.user.findUnique({
                    where: { id: share.sharedWithId },
                    select: { id: true, username: true, email: true, avatar: true }
                });
                return { ...share, sharedWith: user };
            })
        );

        return sharesWithUsers;
    }

    /**
     * Get all instances shared with the user
     */
    async getSharedWithMe(userId: string) {
        const now = new Date();

        const shares = await this.prisma.instanceShare.findMany({
            where: {
                sharedWithId: userId,
                OR: [
                    { expiresAt: null },
                    { expiresAt: { gt: now } }
                ]
            },
            orderBy: { createdAt: 'desc' }
        });

        // Get owner details for each share
        const sharesWithOwners = await Promise.all(
            shares.map(async (share) => {
                const owner = await this.prisma.user.findUnique({
                    where: { id: share.ownerId },
                    select: { id: true, username: true, email: true, avatar: true }
                });
                return { ...share, owner };
            })
        );

        return sharesWithOwners;
    }

    /**
     * Get all shares for a specific instance
     */
    async getSharesForInstance(vmid: number, node: string, ownerId: string) {
        const shares = await this.prisma.instanceShare.findMany({
            where: { vmid, node, ownerId },
            orderBy: { createdAt: 'desc' }
        });

        // Get user details for each share
        const sharesWithUsers = await Promise.all(
            shares.map(async (share) => {
                const user = await this.prisma.user.findUnique({
                    where: { id: share.sharedWithId },
                    select: { id: true, username: true, email: true, avatar: true }
                });
                return { ...share, sharedWith: user };
            })
        );

        return sharesWithUsers;
    }

    /**
     * Check if user has the required permission on an instance
     */
    async hasPermission(
        userId: string,
        vmid: number,
        node: string,
        requiredPermission: SharePermission
    ): Promise<boolean> {
        const now = new Date();

        const share = await this.prisma.instanceShare.findFirst({
            where: {
                vmid,
                node,
                sharedWithId: userId,
                OR: [
                    { expiresAt: null },
                    { expiresAt: { gt: now } }
                ]
            }
        });

        if (!share) {
            return false;
        }

        // Permission hierarchy: ADMIN > MAINTENANCE > READONLY
        const permissionLevel: Record<SharePermission, number> = {
            READONLY: 1,
            MAINTENANCE: 2,
            ADMIN: 3
        };

        return permissionLevel[share.permission] >= permissionLevel[requiredPermission];
    }

    /**
     * Get the share record for a user and instance
     */
    async getShare(userId: string, vmid: number, node: string) {
        const now = new Date();

        return this.prisma.instanceShare.findFirst({
            where: {
                vmid,
                node,
                sharedWithId: userId,
                OR: [
                    { expiresAt: null },
                    { expiresAt: { gt: now } }
                ]
            }
        });
    }

    /**
     * Check if user is the owner of an instance (by checking Proxmox tags)
     * This is used alongside the tag-based ownership in ProxmoxService
     */
    async isOwner(userId: string, vmid: number, node: string): Promise<boolean> {
        // Check if there are any shares where this user is the owner
        const share = await this.prisma.instanceShare.findFirst({
            where: { vmid, node, ownerId: userId }
        });

        // If a share exists with this ownerId, user is owner
        // Otherwise, we rely on the Proxmox tag check in the controller
        return share !== null;
    }

    /**
     * Get all users that can be shared with (for autocomplete)
     */
    async searchUsers(query: string, excludeUserId: string) {
        return this.prisma.user.findMany({
            where: {
                id: { not: excludeUserId },
                OR: [
                    { email: { contains: query, mode: 'insensitive' } },
                    { username: { contains: query, mode: 'insensitive' } }
                ]
            },
            select: {
                id: true,
                username: true,
                email: true,
                avatar: true
            },
            take: 10
        });
    }
}
