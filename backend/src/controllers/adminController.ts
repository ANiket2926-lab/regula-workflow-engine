import { Request, Response } from 'express';
import prisma from '../config/db';
import { SystemLogService } from '../services/systemLogService';

export const getStats = async (req: Request, res: Response) => {
    try {
        const totalUsers = await prisma.user.count();
        const totalWorkflows = await prisma.workflow.count();
        const slaBreaches = await prisma.workflow.count({ where: { isEscalated: true } });

        const webhookTotal = await prisma.webhookLog.count();
        const webhookFailures = await prisma.webhookLog.count({ where: { status: 'FAILED' } });
        const webhookFailureRate = webhookTotal > 0 ? (webhookFailures / webhookTotal) * 100 : 0;

        res.json({
            success: true,
            data: {
                users: totalUsers,
                workflows: totalWorkflows,
                slaBreaches,
                webhookHealth: {
                    total: webhookTotal,
                    failures: webhookFailures,
                    rate: webhookFailureRate.toFixed(1) + '%'
                }
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch stats' });
    }
};

export const getWebhookLogs = async (req: Request, res: Response) => {
    try {
        const logs = await prisma.webhookLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: 50,
            include: {
                workflow: {
                    select: {
                        id: true,
                        title: true
                    }
                }
            }
        });
        res.json({ success: true, data: logs });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch webhook logs' });
    }
};

export const getUsers = async (req: Request, res: Response) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                role: true,
                createdAt: true
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ success: true, data: users });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch users' });
    }
};

export const getSystemLogs = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 50;
        const result = await SystemLogService.getLogs(req.query, page, limit);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch system logs' });
    }
};
