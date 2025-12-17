import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BillingMode, TransactionType, Prisma } from '@prisma/client';

@Injectable()
export class BillingService {
    private readonly logger = new Logger(BillingService.name);

    constructor(private prisma: PrismaService) { }

    // ==================== CREDIT BALANCE ====================

    /**
     * Get user's credit balance (create if not exists)
     */
    async getBalance(userId: string) {
        let balance = await this.prisma.creditBalance.findUnique({
            where: { userId }
        });

        if (!balance) {
            balance = await this.prisma.creditBalance.create({
                data: { userId, balance: 0 }
            });
        }

        return balance;
    }

    /**
     * Add credits to user (admin action)
     */
    async addCredits(userId: string, amount: number, description: string, adminId?: string) {
        if (amount <= 0) {
            throw new BadRequestException('Amount must be positive');
        }

        return this.prisma.$transaction(async (tx) => {
            // Get or create balance
            let balance = await tx.creditBalance.findUnique({ where: { userId } });
            if (!balance) {
                balance = await tx.creditBalance.create({ data: { userId, balance: 0 } });
            }

            const newBalance = balance.balance + amount;

            // Update balance
            await tx.creditBalance.update({
                where: { userId },
                data: { balance: newBalance }
            });

            // Create transaction record
            const transaction = await tx.transaction.create({
                data: {
                    userId,
                    type: TransactionType.CREDIT,
                    amount,
                    balance: newBalance,
                    description,
                    metadata: adminId ? { adminId } : undefined
                }
            });

            return { balance: newBalance, transaction };
        });
    }

    /**
     * Deduct credits from user (for usage)
     */
    async deductCredits(userId: string, amount: number, description: string, metadata?: any) {
        if (amount <= 0) {
            throw new BadRequestException('Amount must be positive');
        }

        return this.prisma.$transaction(async (tx) => {
            const balance = await tx.creditBalance.findUnique({ where: { userId } });
            if (!balance) {
                throw new BadRequestException('User has no credit balance');
            }

            if (balance.balance < amount) {
                throw new BadRequestException(
                    `Insufficient credits. Balance: €${balance.balance.toFixed(2)}, Required: €${amount.toFixed(2)}`
                );
            }

            const newBalance = balance.balance - amount;

            await tx.creditBalance.update({
                where: { userId },
                data: { balance: newBalance }
            });

            const transaction = await tx.transaction.create({
                data: {
                    userId,
                    type: TransactionType.DEBIT,
                    amount: -amount,
                    balance: newBalance,
                    description,
                    metadata
                }
            });

            return { balance: newBalance, transaction };
        });
    }

    /**
     * Check if user has sufficient credits
     */
    async hasSufficientCredits(userId: string, requiredAmount: number): Promise<boolean> {
        const balance = await this.getBalance(userId);
        return balance.balance >= requiredAmount;
    }

    // ==================== PRICING ====================

    /**
     * Get default pricing or first active pricing
     */
    async getDefaultPricing() {
        let pricing = await this.prisma.pricing.findFirst({
            where: { isDefault: true, isActive: true }
        });

        if (!pricing) {
            pricing = await this.prisma.pricing.findFirst({
                where: { isActive: true }
            });
        }

        if (!pricing) {
            // Create default pricing if none exists
            pricing = await this.prisma.pricing.create({
                data: {
                    name: 'Standard',
                    description: 'Default pricing tier',
                    cpuHourly: 0.01,
                    memoryHourly: 0.005,
                    diskHourly: 0.001,
                    cpuMonthly: 5.0,
                    memoryMonthly: 2.5,
                    diskMonthly: 0.5,
                    isDefault: true,
                    isActive: true
                }
            });
        }

        return pricing;
    }

    /**
     * Get all pricing tiers
     */
    async getAllPricing() {
        return this.prisma.pricing.findMany({
            where: { isActive: true },
            orderBy: { createdAt: 'desc' }
        });
    }

    /**
     * Create or update pricing
     */
    async upsertPricing(data: Prisma.PricingCreateInput & { id?: string }) {
        if (data.id) {
            return this.prisma.pricing.update({
                where: { id: data.id },
                data
            });
        }
        return this.prisma.pricing.create({ data });
    }

    // ==================== COST CALCULATION ====================

    /**
     * Calculate hourly cost for an instance
     */
    async calculateHourlyCost(cores: number, memoryMB: number, diskGB: number): Promise<number> {
        const pricing = await this.getDefaultPricing();
        const memoryGB = memoryMB / 1024;

        const cpuCost = cores * pricing.cpuHourly;
        const memoryCost = memoryGB * pricing.memoryHourly;
        const diskCost = diskGB * pricing.diskHourly;

        return cpuCost + memoryCost + diskCost;
    }

    /**
     * Calculate monthly cost for an instance
     */
    async calculateMonthlyCost(cores: number, memoryMB: number, diskGB: number): Promise<number> {
        const pricing = await this.getDefaultPricing();
        const memoryGB = memoryMB / 1024;

        const cpuCost = cores * pricing.cpuMonthly;
        const memoryCost = memoryGB * pricing.memoryMonthly;
        const diskCost = diskGB * pricing.diskMonthly;

        return cpuCost + memoryCost + diskCost;
    }

    /**
     * Get cost estimate for instance creation
     */
    async getEstimate(cores: number, memoryMB: number, diskGB: number) {
        const hourlyRate = await this.calculateHourlyCost(cores, memoryMB, diskGB);
        const monthlyRate = await this.calculateMonthlyCost(cores, memoryMB, diskGB);
        const pricing = await this.getDefaultPricing();

        return {
            hourly: {
                total: hourlyRate,
                breakdown: {
                    cpu: cores * pricing.cpuHourly,
                    memory: (memoryMB / 1024) * pricing.memoryHourly,
                    disk: diskGB * pricing.diskHourly
                }
            },
            monthly: {
                total: monthlyRate,
                breakdown: {
                    cpu: cores * pricing.cpuMonthly,
                    memory: (memoryMB / 1024) * pricing.memoryMonthly,
                    disk: diskGB * pricing.diskMonthly
                }
            },
            paygEstimatedMonthly: hourlyRate * 24 * 30,
            savings: ((hourlyRate * 24 * 30) - monthlyRate) / (hourlyRate * 24 * 30) * 100
        };
    }

    // ==================== USAGE TRACKING ====================

    /**
     * Start tracking usage for an instance
     */
    async startUsageTracking(
        userId: string,
        vmid: number,
        node: string,
        vmType: 'qemu' | 'lxc',
        vmName: string,
        cores: number,
        memoryMB: number,
        diskGB: number,
        billingMode: BillingMode = BillingMode.PAYG
    ) {
        const hourlyRate = await this.calculateHourlyCost(cores, memoryMB, diskGB);
        const monthlyRate = billingMode === BillingMode.RESERVED
            ? await this.calculateMonthlyCost(cores, memoryMB, diskGB)
            : null;

        // Deactivate any existing record for this VM
        await this.prisma.usageRecord.updateMany({
            where: { vmid, userId, isActive: true },
            data: { isActive: false, stoppedAt: new Date() }
        });

        return this.prisma.usageRecord.create({
            data: {
                userId,
                vmid,
                node,
                vmType,
                vmName,
                billingMode,
                cores,
                memoryMB,
                diskGB,
                hourlyRate,
                monthlyRate,
                isActive: true
            }
        });
    }

    /**
     * Stop tracking usage for an instance
     */
    async stopUsageTracking(userId: string, vmid: number) {
        const record = await this.prisma.usageRecord.findFirst({
            where: { userId, vmid, isActive: true }
        });

        if (!record) {
            this.logger.warn(`No active usage record found for VM ${vmid}`);
            return null;
        }

        // Calculate final cost
        const now = new Date();
        const hoursUsed = (now.getTime() - record.startedAt.getTime()) / (1000 * 60 * 60);

        let finalCost = 0;
        if (record.billingMode === BillingMode.PAYG) {
            finalCost = hoursUsed * record.hourlyRate;
        }
        // Reserved instances are pre-paid, no additional charge

        // Update record
        const updatedRecord = await this.prisma.usageRecord.update({
            where: { id: record.id },
            data: {
                isActive: false,
                stoppedAt: now
            }
        });

        return { record: updatedRecord, hoursUsed, finalCost };
    }

    /**
     * Get active usage records for a user
     */
    async getActiveUsage(userId: string) {
        return this.prisma.usageRecord.findMany({
            where: { userId, isActive: true }
        });
    }

    /**
     * Get all usage records for a user
     */
    async getUsageHistory(userId: string, limit = 50) {
        return this.prisma.usageRecord.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: limit
        });
    }

    // ==================== TRANSACTIONS ====================

    /**
     * Get transaction history for a user
     */
    async getTransactions(userId: string, limit = 50) {
        return this.prisma.transaction.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: limit
        });
    }

    /**
     * Get billing summary for a user
     */
    async getBillingSummary(userId: string) {
        const balance = await this.getBalance(userId);
        const activeUsage = await this.getActiveUsage(userId);
        const recentTransactions = await this.getTransactions(userId, 10);

        // Calculate current hourly burn rate
        const hourlyBurnRate = activeUsage.reduce((sum, record) => sum + record.hourlyRate, 0);

        // Calculate estimated remaining time
        const remainingHours = hourlyBurnRate > 0
            ? balance.balance / hourlyBurnRate
            : null;

        return {
            balance: balance.balance,
            currency: balance.currency,
            activeInstances: activeUsage.length,
            hourlyBurnRate,
            estimatedRemainingHours: remainingHours,
            recentTransactions,
            activeUsage
        };
    }

    // ==================== ADMIN FUNCTIONS ====================

    /**
     * Get all users with their balances (admin)
     */
    async getAllBalances() {
        const balances = await this.prisma.creditBalance.findMany({
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                        role: true
                    }
                }
            },
            orderBy: { balance: 'desc' }
        });

        return balances;
    }

    /**
     * Process hourly billing for all active PAYG instances (cron job)
     */
    async processHourlyBilling() {
        const activeRecords = await this.prisma.usageRecord.findMany({
            where: {
                isActive: true,
                billingMode: BillingMode.PAYG
            }
        });

        const results = [];
        const now = new Date();

        for (const record of activeRecords) {
            const lastBilled = record.lastBilledAt || record.startedAt;
            const hoursSinceLastBill = (now.getTime() - lastBilled.getTime()) / (1000 * 60 * 60);

            if (hoursSinceLastBill >= 1) {
                const hoursToCharge = Math.floor(hoursSinceLastBill);
                const amount = hoursToCharge * record.hourlyRate;

                try {
                    await this.deductCredits(
                        record.userId,
                        amount,
                        `Hourly usage: ${record.vmName || `VM ${record.vmid}`} (${hoursToCharge}h)`,
                        { vmid: record.vmid, hours: hoursToCharge, recordId: record.id }
                    );

                    await this.prisma.usageRecord.update({
                        where: { id: record.id },
                        data: { lastBilledAt: now }
                    });

                    results.push({
                        recordId: record.id,
                        vmid: record.vmid,
                        charged: amount,
                        success: true
                    });
                } catch (error) {
                    results.push({
                        recordId: record.id,
                        vmid: record.vmid,
                        error: error.message,
                        success: false
                    });
                    // TODO: Send notification about insufficient credits
                }
            }
        }

        return { processed: results.length, results };
    }
}
