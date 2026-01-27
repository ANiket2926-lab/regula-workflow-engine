import axios from 'axios';
import prisma from '../config/db';
import { SystemLogService } from './systemLogService';

const MAX_RETRIES = 5;

export class WebhookService {
    static async logEvent(workflowId: string, url: string, event: string, payload: any) {
        await prisma.webhookLog.create({
            data: {
                workflowId,
                url,
                event,
                payload: JSON.stringify(payload),
                status: 'PENDING',
                nextRetry: new Date(), // Process immediately
            }
        });
    }

    static async processQueue() {
        const now = new Date();
        const pendingLogs = await prisma.webhookLog.findMany({
            where: {
                status: { in: ['PENDING', 'FAILED'] },
                nextRetry: { lte: now }
            },
            take: 10 // Process in batches
        });

        for (const log of pendingLogs) {
            try {
                await axios.post(log.url, JSON.parse(log.payload));

                await prisma.webhookLog.update({
                    where: { id: log.id },
                    data: { status: 'SUCCESS' }
                });
            } catch (error: any) {
                const nextAttempt = log.attempt + 1;

                if (nextAttempt >= MAX_RETRIES) {
                    await prisma.webhookLog.update({
                        where: { id: log.id },
                        data: { status: 'ABORTED' }
                    });
                    await SystemLogService.log({
                        eventType: 'WEBHOOK_SENT',
                        actorEmail: 'SYSTEM',
                        actorRole: 'SYSTEM',
                        workflowId: log.workflowId,
                        status: 'SUCCESS',
                        message: `Webhook sent to ${log.url}`,
                        metadata: { attempt: log.attempt + 1 }
                    });
                } else {
                    // Exponential backoff: 1m, 2m, 4m, 8m...
                    const delayMinutes = Math.pow(2, nextAttempt);
                    const nextRetry = new Date(now.getTime() + delayMinutes * 60000);

                    await prisma.webhookLog.update({
                        where: { id: log.id },
                        data: {
                            status: 'FAILED',
                            attempt: nextAttempt,
                            nextRetry
                        }
                    });

                    await SystemLogService.log({
                        eventType: 'WEBHOOK_FAILED',
                        actorEmail: 'SYSTEM',
                        actorRole: 'SYSTEM',
                        workflowId: log.workflowId,
                        status: 'FAILURE',
                        message: `Webhook failed for ${log.url} (Attempt ${nextAttempt})`,
                        metadata: { error: error.message }
                    });
                }
            }
        }
    }
}
