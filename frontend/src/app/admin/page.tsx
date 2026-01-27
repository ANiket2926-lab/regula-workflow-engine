'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminService, AdminStats, WebhookLog, User } from '@/services/adminService';
import { ShieldCheck, Activity, AlertTriangle, Users } from 'lucide-react';

export default function AdminDashboard() {
    const [user, setUser] = useState<any>(null);
    const router = useRouter();
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [logs, setLogs] = useState<WebhookLog[]>([]);
    const [usersList, setUsersList] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (!token || !userData) {
            router.push('/login');
            return;
        }

        const parsedUser = JSON.parse(userData);
        if (parsedUser.role !== 'ADMIN') {
            router.push('/dashboard');
            return;
        }

        setUser(parsedUser);
        loadData(token);
    }, [router]);

    const loadData = async (token?: string) => {
        const t = token || localStorage.getItem('token');
        if (!t) return;

        try {
            const [statsData, logsData, usersData] = await Promise.all([
                adminService.getStats(t),
                adminService.getWebhookLogs(t),
                adminService.getUsers(t)
            ]);
            setStats(statsData);
            setLogs(logsData);
            setUsersList(usersData);
        } catch (err) {
            console.error('Failed to load admin data', err);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) return <div style={{ padding: 40, textAlign: 'center', color: '#666' }}>Loading Admin Dashboard...</div>;

    const containerStyle = { padding: '20px 40px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' };
    const headerStyle = { marginBottom: 30, display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
    const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 30 };

    return (
        <div style={containerStyle}>
            <div style={headerStyle}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#111' }}>System Administration</h1>
                    <p style={{ marginTop: 5, color: '#666' }}>Monitor system health, SLAs, and webhook delivery.</p>
                </div>
                <button
                    onClick={() => router.push('/admin/logs')}
                    style={{
                        background: '#3182ce', color: 'white', border: 'none', padding: '10px 20px',
                        borderRadius: 6, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8
                    }}
                >
                    <Activity size={18} /> View System Logs
                </button>
            </div>

            {/* Stats Grid */}
            <div style={gridStyle}>
                <StatsCard icon={<Users size={20} color="#0070f3" />} label="Total Users" value={stats?.users || 0} />
                <StatsCard icon={<Activity size={20} color="#28a745" />} label="Total Workflows" value={stats?.workflows || 0} />
                <StatsCard icon={<AlertTriangle size={20} color="#dc3545" />} label="Active SLA Breaches" value={stats?.slaBreaches || 0} color="#dc3545" />
                <StatsCard
                    icon={<ShieldCheck size={20} color="#6f42c1" />}
                    label="Webhook Health"
                    value={stats?.webhookHealth.rate || '100%'}
                    sublabel={`${stats?.webhookHealth.failures} failures / ${stats?.webhookHealth.total} total`}
                />
            </div>

            <div style={{ display: 'flex', gap: 30, flexWrap: 'wrap' }}>

                {/* Left Column: Webhook Logs */}
                <div style={{ flex: 2, minWidth: 300 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>Recent Webhooks</h2>
                        <button
                            onClick={() => loadData()}
                            style={{ background: 'none', border: 'none', color: '#0070f3', cursor: 'pointer', fontSize: '0.9rem' }}
                        >
                            Refresh
                        </button>
                    </div>

                    <div style={{ background: '#fff', border: '1px solid #eaeaea', borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ background: '#f9fafb', borderBottom: '1px solid #eaeaea' }}>
                                <tr>
                                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.8rem', color: '#666', textTransform: 'uppercase' }}>Status</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.8rem', color: '#666', textTransform: 'uppercase' }}>Event</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.8rem', color: '#666', textTransform: 'uppercase' }}>Workflow</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.8rem', color: '#666', textTransform: 'uppercase' }}>Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log) => (
                                    <tr key={log.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                        <td style={{ padding: '12px 16px' }}>
                                            <StatusBadge status={log.status} />
                                            {log.status === 'FAILED' && log.nextRetry && (
                                                <div style={{ fontSize: '0.75rem', color: '#ff9800', marginTop: 4 }}>Retry: {new Date(log.nextRetry).toLocaleTimeString()}</div>
                                            )}
                                        </td>
                                        <td style={{ padding: '12px 16px', fontSize: '0.9rem' }}>{log.event}</td>
                                        <td style={{ padding: '12px 16px', fontSize: '0.9rem', color: '#555' }}>
                                            {log.workflow?.title || log.workflow?.id?.substring(0, 8)}
                                        </td>
                                        <td style={{ padding: '12px 16px', fontSize: '0.9rem', color: '#888' }}>
                                            {new Date(log.createdAt).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {logs.length === 0 && <div style={{ padding: 20, textAlign: 'center', color: '#888' }}>No logs found.</div>}
                    </div>
                </div>

                {/* Right Column: User Management */}
                <div style={{ flex: 1, minWidth: 250 }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 600, margin: '0 0 15px 0' }}>Users</h2>
                    <div style={{ background: '#fff', border: '1px solid #eaeaea', borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                            {usersList.map((user, idx) => (
                                <li key={user.id} style={{ padding: '15px', borderBottom: idx !== usersList.length - 1 ? '1px solid #f0f0f0' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{user.email}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#888' }}>Joined {new Date(user.createdAt).toLocaleDateString()}</div>
                                    </div>
                                    <span style={{
                                        padding: '2px 8px', borderRadius: 10, fontSize: '0.75rem', fontWeight: 600,
                                        background: user.role === 'ADMIN' ? '#000' : '#f0f0f0',
                                        color: user.role === 'ADMIN' ? '#fff' : '#333'
                                    }}>
                                        {user.role}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

            </div>
        </div>
    );
}

function StatsCard({ icon, label, value, sublabel, color = '#111' }: any) {
    return (
        <div style={{ background: '#fff', padding: 20, borderRadius: 8, border: '1px solid #eaeaea', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ fontSize: '0.9rem', color: '#666', fontWeight: 500 }}>{label}</div>
                <div style={{ padding: 8, background: '#f5f5f5', borderRadius: 6 }}>{icon}</div>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, marginTop: 10, color }}>{value}</div>
            {sublabel && <div style={{ fontSize: '0.8rem', color: '#888', marginTop: 5 }}>{sublabel}</div>}
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles: any = {
        SUCCESS: { bg: '#e6fffa', color: '#047857' },
        FAILED: { bg: '#fff5f5', color: '#c53030' },
        QUEUED: { bg: '#fffbe6', color: '#b7791f' }
    };
    const style = styles[status] || { bg: '#f7fafc', color: '#4a5568' };

    return (
        <span style={{
            padding: '4px 10px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600,
            backgroundColor: style.bg, color: style.color
        }}>
            {status}
        </span>
    );
}
