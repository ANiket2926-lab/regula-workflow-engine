import { User, Workflow, WorkflowAuditLog } from '@prisma/client';

export type Role = 'EXECUTOR' | 'REVIEWER' | 'REQUESTER' | 'ADMIN';
export type WorkflowStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'EXECUTED';

// Request User Interface extensions
declare global {
    namespace Express {
        interface Request {
            user?: UserPayload;
        }
    }
}

export interface Step {
    name: string;
    role: Role; // Role required to APPROVE this step
    slaHours: number; // SLA in hours
}

export interface UserPayload {
    id: string;
    email: string;
    role: Role;
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}
