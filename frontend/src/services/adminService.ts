import { api } from '../utils/api';

export interface AdminStats {
    users: number;
    workflows: number;
    slaBreaches: number;
    webhookHealth: {
        total: number;
        failures: number;
        rate: string;
    };
}

export interface WebhookLog {
    id: string;
    url: string;
    event: string;
    status: 'QEUED' | 'SUCCESS' | 'FAILED'; // Adjust based on Prisma enum if needed
    attempt: number;
    nextRetry: string | null;
    createdAt: string;
    workflow: {
        id: string;
        title: string;
    };
}

export interface User {
    id: string;
    email: string;
    role: string;
    createdAt: string;
}

export const adminService = {
    getStats: async (token: string): Promise<AdminStats> => {
        const res = await api.get('/admin/stats', token);
        return res.data;
    },
    getWebhookLogs: async (token: string): Promise<WebhookLog[]> => {
        const res = await api.get('/admin/webhooks', token);
        return res.data;
    },
    getUsers: async (token: string): Promise<User[]> => {
        const res = await api.get('/admin/users', token);
        return res.data;
    },
    getSystemLogs: async (token: string, page = 1, limit = 50, filters = {}): Promise<any> => {
        const query = new URLSearchParams({ page: page.toString(), limit: limit.toString(), ...filters }).toString();
        const res = await api.get(`/admin/logs?${query}`, token);
        return res.data;
    }
};
