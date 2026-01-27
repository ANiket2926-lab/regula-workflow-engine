import prisma from '../config/db';

export interface SystemLogEvent {
    eventType: string;
    actorEmail?: string;
    actorRole: string; // 'ADMIN' | 'REQUESTER' | 'REVIEWER' | 'EXECUTOR' | 'SYSTEM'
    workflowId?: string;
    status: 'SUCCESS' | 'FAILURE' | 'INFO';
    message: string;
    metadata?: Record<string, any>;
}

export const SystemLogService = {
    log: async (event: SystemLogEvent) => {
        try {
            await prisma.systemLog.create({
                data: {
                    eventType: event.eventType,
                    actorEmail: event.actorEmail,
                    actorRole: event.actorRole,
                    workflowId: event.workflowId,
                    status: event.status,
                    message: event.message,
                    metadata: event.metadata ? JSON.stringify(event.metadata) : undefined,
                },
            });
        } catch (error) {
            console.error('Failed to write system log:', error);
            // Fail silently as per requirements
        }
    },

    getLogs: async (filters: any = {}, page: number = 1, limit: number = 50) => {
        const skip = (page - 1) * limit;
        const where: any = {};

        if (filters.eventType) where.eventType = filters.eventType;
        if (filters.workflowId) where.workflowId = filters.workflowId;
        if (filters.actorRole) where.actorRole = filters.actorRole;
        if (filters.startDate && filters.endDate) {
            where.timestamp = {
                gte: new Date(filters.startDate),
                lte: new Date(filters.endDate),
            };
        }

        const [logs, total] = await prisma.$transaction([
            prisma.systemLog.findMany({
                where,
                orderBy: { timestamp: 'desc' },
                skip,
                take: limit,
            }),
            prisma.systemLog.count({ where }),
        ]);

        return {
            logs: logs.map(log => ({
                ...log,
                metadata: log.metadata ? JSON.parse(log.metadata) : null
            })),
            total,
            page,
            totalPages: Math.ceil(total / limit)
        };
    },

    getWorkflowLogs: async (workflowId: string) => {
        const logs = await prisma.systemLog.findMany({
            where: { workflowId },
            orderBy: { timestamp: 'desc' }
        });

        return logs.map(log => ({
            ...log,
            metadata: log.metadata ? JSON.parse(log.metadata) : null
        }));
    }
};
