import {
    Controller,
    Get,
    Post,
    Body,
    Query,
    Param,
    UseGuards,
    Request,
    ForbiddenException
} from '@nestjs/common';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BillingMode } from '@prisma/client';

@Controller('billing')
@UseGuards(JwtAuthGuard)
export class BillingController {
    constructor(private readonly billingService: BillingService) { }

    // ==================== USER ENDPOINTS ====================

    /**
     * Get current user's billing summary
     */
    @Get('summary')
    async getSummary(@Request() req: any) {
        return this.billingService.getBillingSummary(req.user.id);
    }

    /**
     * Get current user's balance
     */
    @Get('balance')
    async getBalance(@Request() req: any) {
        return this.billingService.getBalance(req.user.id);
    }

    /**
     * Get current user's transaction history
     */
    @Get('transactions')
    async getTransactions(
        @Request() req: any,
        @Query('limit') limit?: string
    ) {
        return this.billingService.getTransactions(
            req.user.id,
            limit ? parseInt(limit) : 50
        );
    }

    /**
     * Get current user's usage history
     */
    @Get('usage')
    async getUsage(
        @Request() req: any,
        @Query('limit') limit?: string
    ) {
        return this.billingService.getUsageHistory(
            req.user.id,
            limit ? parseInt(limit) : 50
        );
    }

    /**
     * Get active usage for current user
     */
    @Get('usage/active')
    async getActiveUsage(@Request() req: any) {
        return this.billingService.getActiveUsage(req.user.id);
    }

    /**
     * Get cost estimate for a new instance
     */
    @Get('estimate')
    async getEstimate(
        @Query('cores') cores: string,
        @Query('memory') memory: string,
        @Query('disk') disk: string
    ) {
        return this.billingService.getEstimate(
            parseInt(cores) || 1,
            parseInt(memory) || 1024,
            parseInt(disk) || 20
        );
    }

    /**
     * Get all pricing tiers
     */
    @Get('pricing')
    async getPricing() {
        return this.billingService.getAllPricing();
    }

    /**
     * Get default pricing
     */
    @Get('pricing/default')
    async getDefaultPricing() {
        return this.billingService.getDefaultPricing();
    }

    // ==================== ADMIN ENDPOINTS ====================

    /**
     * Add credits to a user (admin only)
     */
    @Post('credits')
    async addCredits(
        @Request() req: any,
        @Body() body: { userId: string; amount: number; description?: string }
    ) {
        if (req.user.role !== 'ADMIN') {
            throw new ForbiddenException('Admin access required');
        }

        return this.billingService.addCredits(
            body.userId,
            body.amount,
            body.description || `Credit allocation by admin`,
            req.user.id
        );
    }

    /**
     * Get all user balances (admin only)
     */
    @Get('admin/balances')
    async getAllBalances(@Request() req: any) {
        if (req.user.role !== 'ADMIN') {
            throw new ForbiddenException('Admin access required');
        }

        return this.billingService.getAllBalances();
    }

    /**
     * Get transactions for a specific user (admin only)
     */
    @Get('admin/transactions/:userId')
    async getUserTransactions(
        @Request() req: any,
        @Param('userId') userId: string,
        @Query('limit') limit?: string
    ) {
        if (req.user.role !== 'ADMIN') {
            throw new ForbiddenException('Admin access required');
        }

        return this.billingService.getTransactions(
            userId,
            limit ? parseInt(limit) : 50
        );
    }

    /**
     * Create or update pricing (admin only)
     */
    @Post('pricing')
    async upsertPricing(
        @Request() req: any,
        @Body() body: {
            id?: string;
            name: string;
            description?: string;
            cpuHourly: number;
            memoryHourly: number;
            diskHourly: number;
            cpuMonthly: number;
            memoryMonthly: number;
            diskMonthly: number;
            isDefault?: boolean;
        }
    ) {
        if (req.user.role !== 'ADMIN') {
            throw new ForbiddenException('Admin access required');
        }

        return this.billingService.upsertPricing(body);
    }

    /**
     * Process hourly billing manually (admin only, for testing)
     */
    @Post('admin/process-billing')
    async processBilling(@Request() req: any) {
        if (req.user.role !== 'ADMIN') {
            throw new ForbiddenException('Admin access required');
        }

        return this.billingService.processHourlyBilling();
    }
}
