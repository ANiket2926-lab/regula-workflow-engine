import { WorkflowStatus } from '../types';
import { ValidationError } from './errors';

const ALLOWED_TRANSITIONS: Record<WorkflowStatus, WorkflowStatus[]> = {
    DRAFT: ['SUBMITTED'],
    SUBMITTED: ['APPROVED', 'REJECTED'],
    APPROVED: ['EXECUTED'],
    REJECTED: [],
    EXECUTED: [],
};

export function validateTransition(currentStatus: WorkflowStatus, nextStatus: WorkflowStatus): void {
    const allowed = ALLOWED_TRANSITIONS[currentStatus];
    if (!allowed || !allowed.includes(nextStatus)) {
        throw new ValidationError(`Invalid transition from ${currentStatus} to ${nextStatus}`);
    }
}
