import prisma from '../config/db';
import { WorkflowStatus, UserPayload } from '../types';
import { ForbiddenError, NotFoundError, ValidationError } from '../utils/errors';
import { validateTransition } from '../utils/stateMachine';
import { sendEmail, buildWorkflowEmail } from './emailService';
import { SystemLogService } from './systemLogService';

// Helper to get users by role for notifications
async function getUsersByRole(role: string): Promise<string[]> {
    const users = await prisma.user.findMany({ where: { role }, select: { email: true } });
    return users.map(u => u.email);
}

export class WorkflowService {
    static async createWorkflow(user: UserPayload, title: string, description: string, templateId?: string, webhookUrl?: string) {
        if (user.role !== 'REQUESTER') {
            throw new ForbiddenError('Only Requesters can create workflows');
        }

        const result = await prisma.$transaction(async (tx) => {
            const workflow = await tx.workflow.create({
                data: {
                    title,
                    description,
                    requesterId: user.id,
                    status: 'DRAFT',
                    templateId,
                    currentStep: 0,
                    webhookUrl
                },
            });

            await tx.workflowAuditLog.create({
                data: {
                    workflowId: workflow.id,
                    action: 'CREATE',
                    fromStatus: null,
                    toStatus: 'DRAFT',
                    performedByEmail: user.email,
                    performedByRole: user.role,
                },
            });

            return workflow;
        });

        // Log Create
        await SystemLogService.log({
            eventType: 'WORKFLOW_CREATE',
            actorEmail: user.email,
            actorRole: user.role,
            workflowId: result.id,
            status: 'SUCCESS',
            message: `Workflow '${title}' created.`,
        });

        return result;
    }

    static async getWorkflows(user: UserPayload) {
        if (user.role === 'EXECUTOR' || user.role === 'REVIEWER') {
            return await prisma.workflow.findMany({ include: { requester: true, template: true } });
        }
        // Requester sees their own
        return await prisma.workflow.findMany({
            where: { requesterId: user.id },
            include: { requester: true, template: true }
        });
    }

    static async getWorkflowById(id: string, user: UserPayload) {
        const workflow = await prisma.workflow.findUnique({
            where: { id },
            include: { requester: true, template: true, auditLogs: { orderBy: { timestamp: 'asc' } } }
        });

        if (!workflow) throw new NotFoundError('Workflow not found');

        // Access control: Requesters only see their own
        if (user.role === 'REQUESTER' && workflow.requesterId !== user.id) {
            throw new ForbiddenError('Access denied');
        }

        return workflow;
    }

    static async checkSLAs() {
        const now = new Date();
        const workflows = await prisma.workflow.findMany({
            where: {
                status: 'SUBMITTED',
                isEscalated: false,
                templateId: { not: null }
            },
            include: { template: true, requester: true }
        });

        for (const wf of workflows) {
            if (!wf.template) continue;
            const steps = JSON.parse(wf.template.steps) as { name: string, role: string, slaHours?: number }[];
            const currentStepDef = steps[wf.currentStep];

            // Default SLA 24 hours if not defined
            const slaHours = currentStepDef.slaHours || 24;
            const deadline = new Date(wf.stepStartTime.getTime() + slaHours * 60 * 60 * 1000);

            if (now > deadline) {
                // ESCALATE
                await prisma.$transaction(async (tx) => {
                    await tx.workflow.update({
                        where: { id: wf.id },
                        data: { isEscalated: true }
                    });

                    await tx.workflowAuditLog.create({
                        data: {
                            workflowId: wf.id,
                            action: 'ESCALATION',
                            fromStatus: wf.status,
                            toStatus: wf.status,
                            performedByEmail: 'SYSTEM',
                            performedByRole: 'SYSTEM',
                            comment: `SLA Breached for step '${currentStepDef.name}'. Deadline was ${deadline.toISOString()}`,
                            stepIndex: wf.currentStep
                        }
                    });

                    await SystemLogService.log({
                        eventType: 'SLA_BREACH',
                        actorEmail: 'SYSTEM',
                        actorRole: 'SYSTEM',
                        workflowId: wf.id,
                        status: 'FAILURE', // Breach is a failure of meeting SLA
                        message: `SLA Breached for step '${currentStepDef.name}'.`,
                        metadata: { step: currentStepDef.name, deadline: deadline.toISOString() }
                    });
                });

                // Notify Reviewer/Executor (Current Role)
                getUsersByRole(currentStepDef.role).then(emails => {
                    emails.forEach(email => sendEmail({
                        to: email,
                        subject: `[URGENT] SLA Breach: ${wf.title}`,
                        text: `The workflow '${wf.title}' is now ESCALATED.\nStep: ${currentStepDef.name}\nDeadline: ${deadline.toISOString()}`
                    }));
                });
            }
        }
    }

    static async transitionWorkflow(id: string, user: UserPayload, action: 'SUBMIT' | 'APPROVE' | 'REJECT' | 'EXECUTE', comment?: string) {
        const result = await prisma.$transaction(async (tx) => {
            const workflow = await tx.workflow.findUnique({ where: { id }, include: { requester: true, template: true } });
            if (!workflow) throw new NotFoundError('Workflow not found');

            const currentStatus = workflow.status as WorkflowStatus;
            let nextStatus: WorkflowStatus;
            let nextStep = workflow.currentStep;

            // --- Dynamic Workflow Logic ---
            if (workflow.template) {
                const steps = JSON.parse(workflow.template.steps) as { name: string, role: string }[];
                const currentStepDef = steps[workflow.currentStep];

                if (action === 'SUBMIT') {
                    if (currentStatus !== 'DRAFT') throw new ValidationError('Can only submit from DRAFT');
                    nextStatus = 'SUBMITTED';
                    nextStep = 0; // Start at step 0
                }
                else if (action === 'APPROVE') {
                    if (currentStatus !== 'SUBMITTED') throw new ValidationError('Workflow is not in a submittted state');

                    // Validate Role for CURRENT step
                    if (user.role !== currentStepDef.role) {
                        throw new ForbiddenError(`Current step '${currentStepDef.name}' requires role ${currentStepDef.role}`);
                    }

                    // Move to next step or finish
                    if (workflow.currentStep < steps.length - 1) {
                        nextStep = workflow.currentStep + 1;
                        nextStatus = 'SUBMITTED'; // Still in progress
                    } else {
                        nextStatus = 'EXECUTED'; // Completed
                    }
                }
                else if (action === 'REJECT') {
                    if (currentStatus !== 'SUBMITTED') throw new ValidationError('Can only reject submitted workflows');
                    if (user.role !== currentStepDef.role) { // Only current step owner can reject? Or any admin? Let's say current step owner.
                        throw new ForbiddenError(`Current step '${currentStepDef.name}' requires role ${currentStepDef.role}`);
                    }
                    nextStatus = 'REJECTED';
                }
                else {
                    throw new ValidationError('Invalid action for dynamic workflow');
                }
            }
            // --- Legacy Workflow Logic ---
            else {
                switch (action) {
                    case 'SUBMIT': nextStatus = 'SUBMITTED'; break;
                    case 'APPROVE': nextStatus = 'APPROVED'; break;
                    case 'REJECT': nextStatus = 'REJECTED'; break;
                    case 'EXECUTE': nextStatus = 'EXECUTED'; break;
                    default: throw new ValidationError('Invalid action');
                }

                // RBAC for Legacy
                if (action === 'SUBMIT' && (user.role !== 'REQUESTER' || workflow.requesterId !== user.id)) throw new ForbiddenError('Unauthorized to SUBMIT');
                if ((action === 'APPROVE' || action === 'REJECT') && user.role !== 'REVIEWER') throw new ForbiddenError('Unauthorized to REVIEW');
                if (action === 'EXECUTE' && user.role !== 'EXECUTOR') throw new ForbiddenError('Unauthorized to EXECUTE');
            }

            // Common Validation
            validateTransition(currentStatus, nextStatus);

            // Mandatory Comments
            if ((action === 'APPROVE' || action === 'REJECT') && (!comment || comment.trim() === '')) {
                throw new ValidationError('Comment is mandatory');
            }

            // Update
            const updatedWorkflow = await tx.workflow.update({
                where: { id },
                data: {
                    status: nextStatus,
                    currentStep: nextStep,
                    stepStartTime: new Date(), // Reset Timer
                    isEscalated: false // Clear Escalation
                },
                include: { auditLogs: true, requester: true }
            });

            // Audit
            await tx.workflowAuditLog.create({
                data: {
                    workflowId: workflow.id,
                    action: action,
                    fromStatus: currentStatus,
                    toStatus: nextStatus,
                    performedByEmail: user.email,
                    performedByRole: user.role,
                    comment: comment || null,
                    stepIndex: workflow.template ? workflow.currentStep : null
                },
            });

            return { updatedWorkflow, requesterEmail: workflow.requester.email, title: workflow.title, nextStatus };
        });

        // System Logging
        const { updatedWorkflow, requesterEmail, title, nextStatus } = result;
        const eventMap: any = {
            'SUBMIT': 'WORKFLOW_SUBMIT',
            'APPROVE': 'WORKFLOW_APPROVE',
            'REJECT': 'WORKFLOW_REJECT',
            'EXECUTE': 'WORKFLOW_EXECUTE'
        };

        await SystemLogService.log({
            eventType: eventMap[action] || 'WORKFLOW_STATUS_CHANGE',
            actorEmail: user.email,
            actorRole: user.role,
            workflowId: updatedWorkflow.id,
            status: 'SUCCESS',
            message: `Workflow '${updatedWorkflow.title}' was ${action}ED to ${nextStatus}`,
            metadata: { fromStatus: 'UNKNOWN', toStatus: nextStatus, comment } // Simplified for now
        });

        // 7. Send Email Notifications (Async, Non-Blocking, Outside Transaction)
        // const { updatedWorkflow, requesterEmail, title, nextStatus } = result; // Already destructured above
        const timestamp = new Date();

        // Fire-and-forget emails - do not await, do not block
        if (action === 'SUBMIT') {
            // Notify all Reviewers
            getUsersByRole('REVIEWER').then(emails => {
                emails.forEach(email => sendEmail({
                    to: email,
                    subject: `[Regula] Workflow Submitted: ${title}`,
                    text: buildWorkflowEmail('SUBMITTED', title, nextStatus, timestamp),
                }));
            });
        } else if (action === 'APPROVE') {
            // Notify all Executors
            getUsersByRole('EXECUTOR').then(emails => {
                emails.forEach(email => sendEmail({
                    to: email,
                    subject: `[Regula] Workflow Approved: ${title}`,
                    text: buildWorkflowEmail('APPROVED', title, nextStatus, timestamp),
                }));
            });
        } else if (action === 'REJECT') {
            // Notify the Requester
            sendEmail({
                to: requesterEmail,
                subject: `[Regula] Workflow Rejected: ${title}`,
                text: buildWorkflowEmail('REJECTED', title, nextStatus, timestamp),
            });
        } else if (action === 'EXECUTE') {
            // Notify the Requester
            sendEmail({
                to: requesterEmail,
                subject: `[Regula] Workflow Executed: ${title}`,
                text: buildWorkflowEmail('EXECUTED', title, nextStatus, timestamp),
            });
        }

        return updatedWorkflow;
    }
}

