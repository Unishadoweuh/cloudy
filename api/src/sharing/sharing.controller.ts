import {
    Controller,
    Get,
    Post,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    Request,
    Headers,
} from '@nestjs/common';
import { SharingService } from './sharing.service';
import { AuditService } from '../audit/audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SharePermission, AuditAction, AuditCategory } from '@prisma/client';

@Controller('sharing')
@UseGuards(JwtAuthGuard)
export class SharingController {
    constructor(
        private readonly sharingService: SharingService,
        private readonly auditService: AuditService
    ) { }

    /**
     * Share an instance with another user
     */
    @Post()
    async shareInstance(
        @Request() req: any,
        @Body() body: {
            vmid: number;
            node: string;
            vmType: string;
            vmName: string;
            email: string;
            permission: SharePermission;
            expiresAt?: string;
        },
        @Headers('x-forwarded-for') forwardedFor?: string,
        @Headers('user-agent') userAgent?: string
    ) {
        const ipAddress = forwardedFor || req.ip;
        const expiresAt = body.expiresAt ? new Date(body.expiresAt) : undefined;

        const share = await this.sharingService.shareInstance(
            req.user.id,
            body.vmid,
            body.node,
            body.vmType,
            body.vmName,
            body.email,
            body.permission,
            expiresAt
        );

        // Audit log
        await this.auditService.log({
            action: AuditAction.SHARE_INSTANCE,
            category: AuditCategory.COMPUTE,
            userId: req.user.id,
            username: req.user.username,
            targetId: body.vmid.toString(),
            targetName: body.vmName,
            targetType: body.vmType,
            details: {
                sharedWithEmail: body.email,
                permission: body.permission,
                expiresAt: body.expiresAt
            },
            ipAddress,
            userAgent,
        });

        return share;
    }

    /**
     * Get instances I've shared with others
     */
    @Get('my-shares')
    async getMyShares(@Request() req: any) {
        return this.sharingService.getMyShares(req.user.id);
    }

    /**
     * Get instances shared with me
     */
    @Get('shared-with-me')
    async getSharedWithMe(@Request() req: any) {
        return this.sharingService.getSharedWithMe(req.user.id);
    }

    /**
     * Get shares for a specific instance
     */
    @Get('instance/:vmid')
    async getSharesForInstance(
        @Request() req: any,
        @Param('vmid') vmid: string,
        @Query('node') node: string
    ) {
        return this.sharingService.getSharesForInstance(
            parseInt(vmid),
            node,
            req.user.id
        );
    }

    /**
     * Revoke a share
     */
    @Delete(':id')
    async revokeShare(
        @Request() req: any,
        @Param('id') shareId: string,
        @Headers('x-forwarded-for') forwardedFor?: string,
        @Headers('user-agent') userAgent?: string
    ) {
        const ipAddress = forwardedFor || req.ip;

        const share = await this.sharingService.revokeShare(req.user.id, shareId);

        // Audit log
        await this.auditService.log({
            action: AuditAction.REVOKE_SHARE,
            category: AuditCategory.COMPUTE,
            userId: req.user.id,
            username: req.user.username,
            targetId: share.vmid.toString(),
            targetName: share.vmName || `VM ${share.vmid}`,
            targetType: share.vmType,
            details: { shareId, sharedWithId: share.sharedWithId },
            ipAddress,
            userAgent,
        });

        return { success: true };
    }

    /**
     * Search users for sharing autocomplete
     */
    @Get('users/search')
    async searchUsers(
        @Request() req: any,
        @Query('q') query: string
    ) {
        if (!query || query.length < 2) {
            return [];
        }
        return this.sharingService.searchUsers(query, req.user.id);
    }
}
