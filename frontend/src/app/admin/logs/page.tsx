'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminService } from '@/services/adminService';
import { api } from '@/utils/api';

export default function SystemLogsPage() {
    const router = useRouter();
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filters, setFilters] = useState({
        eventType: '',
        actorRole: '',
        workflowId: '',
        startDate: '',
        endDate: ''
    });
    const [selectedLog, setSelectedLog] = useState<any>(null);

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

        fetchLogs();
    }, [page, filters]); // Re-fetch when page or filters change

    const fetchLogs = async () => {
        setLoading(true);
        const token = localStorage.getItem('token');
        try {
            // Clean empty filters
            const activeFilters: any = {};
            if (filters.eventType) activeFilters.eventType = filters.eventType;
            if (filters.actorRole) activeFilters.actorRole = filters.actorRole;
            if (filters.workflowId) activeFilters.workflowId = filters.workflowId;
            if (filters.startDate) activeFilters.startDate = filters.startDate;
            if (filters.endDate) activeFilters.endDate = filters.endDate;

            const res = await adminService.getSystemLogs(token!, page, 50, activeFilters);
            setLogs(res.logs);
            setTotalPages(res.totalPages);
        } catch (error) {
            console.error('Failed to fetch logs', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e: any) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setPage(1); // Reset to page 1 on filter change
    };

    // Styles
    const containerStyle = { padding: '20px 40px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' };
    const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 };
    const filterStyle = { display: 'flex', gap: 10, padding: 15, background: '#f9fafb', borderRadius: 8, border: '1px solid #eaeaea', marginBottom: 20, flexWrap: 'wrap' as 'wrap' };
    const inputStyle = { padding: '8px 12px', border: '1px solid #ddd', borderRadius: 4, fontSize: '0.9rem' };
    const tableStyle = { width: '100%', borderCollapse: 'collapse' as 'collapse' };
    const thStyle = { background: '#f7fafc', padding: '12px 16px', textAlign: 'left' as 'left', fontSize: '0.8rem', textTransform: 'uppercase' as 'uppercase', color: '#718096', borderBottom: '1px solid #e2e8f0' };
    const tdStyle = { padding: '12px 16px', borderBottom: '1px solid #f0f0f0', fontSize: '0.9rem', color: '#2d3748' };

    return (
        <div style={containerStyle}>
            <div style={headerStyle}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#1a202c' }}>System Logs</h1>
                    <p style={{ marginTop: 5, color: '#718096' }}>Immutable audit trail of all system events.</p>
                </div>
                <button
                    onClick={() => router.push('/admin')}
                    style={{ background: 'white', border: '1px solid #ddd', padding: '8px 16px', borderRadius: 6, cursor: 'pointer', color: '#666' }}
                >
                    &larr; Back to Admin Dashboard
                </button>
            </div>

            {/* Filters */}
            <div style={filterStyle}>
                <input
                    type="text"
                    name="eventType"
                    placeholder="Event Type (e.g. LOGIN_SUCCESS)"
                    value={filters.eventType}
                    onChange={handleFilterChange}
                    style={inputStyle}
                />
                <select name="actorRole" value={filters.actorRole} onChange={handleFilterChange} style={inputStyle}>
                    <option value="">All Roles</option>
                    <option value="ADMIN">ADMIN</option>
                    <option value="REQUESTER">REQUESTER</option>
                    <option value="REVIEWER">REVIEWER</option>
                    <option value="EXECUTOR">EXECUTOR</option>
                    <option value="SYSTEM">SYSTEM</option>
                </select>
                <input
                    type="text"
                    name="workflowId"
                    placeholder="Workflow ID"
                    value={filters.workflowId}
                    onChange={handleFilterChange}
                    style={inputStyle}
                />
                <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} style={inputStyle} />
                <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} style={inputStyle} />
                <button onClick={fetchLogs} style={{ ...inputStyle, background: '#3182ce', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Apply Filters</button>
            </div>

            {/* Table */}
            <div style={{ background: 'white', border: '1px solid #eaeaea', borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                {loading ? (
                    <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>Loading logs...</div>
                ) : (
                    <>
                        <table style={tableStyle}>
                            <thead>
                                <tr>
                                    <th style={thStyle}>Timestamp</th>
                                    <th style={thStyle}>Event Type</th>
                                    <th style={thStyle}>Actor</th>
                                    <th style={thStyle}>Role</th>
                                    <th style={thStyle}>Status</th>
                                    <th style={thStyle}>Message</th>
                                    <th style={thStyle}>Details</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#718096' }}>No system logs recorded yet.</td>
                                    </tr>
                                ) : (
                                    logs.map(log => (
                                        <tr key={log.id}>
                                            <td style={tdStyle}>{new Date(log.timestamp).toLocaleString()}</td>
                                            <td style={tdStyle}>
                                                <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{log.eventType}</span>
                                            </td>
                                            <td style={tdStyle}>{log.actorEmail || 'System'}</td>
                                            <td style={tdStyle}>
                                                <span style={{
                                                    background: log.actorRole === 'SYSTEM' ? '#cbd5e0' : '#ebf8ff',
                                                    color: log.actorRole === 'SYSTEM' ? '#2d3748' : '#3182ce',
                                                    padding: '2px 6px', borderRadius: 4, fontSize: '0.75rem', fontWeight: 600
                                                }}>
                                                    {log.actorRole}
                                                </span>
                                            </td>
                                            <td style={tdStyle}>
                                                <span style={{
                                                    color: log.status === 'SUCCESS' ? '#2f855a' : (log.status === 'FAILURE' ? '#c53030' : '#2b6cb0'),
                                                    fontWeight: 600, fontSize: '0.85rem'
                                                }}>
                                                    {log.status}
                                                </span>
                                            </td>
                                            <td style={{ ...tdStyle, maxWidth: 300, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={log.message}>
                                                {log.message}
                                            </td>
                                            <td style={tdStyle}>
                                                {log.metadata && (
                                                    <button
                                                        onClick={() => setSelectedLog(log)}
                                                        style={{ color: '#3182ce', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontSize: '0.85rem' }}
                                                    >
                                                        View JSON
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>

                        {/* Pagination */}
                        <div style={{ padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #eaeaea', background: '#f9fafb' }}>
                            <div style={{ fontSize: '0.9rem', color: '#666' }}>Page {page} of {totalPages}</div>
                            <div style={{ display: 'flex', gap: 10 }}>
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    style={{ padding: '6px 14px', border: '1px solid #ddd', borderRadius: 4, background: page === 1 ? '#f5f5f5' : 'white', cursor: page === 1 ? 'not-allowed' : 'pointer' }}
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    style={{ padding: '6px 14px', border: '1px solid #ddd', borderRadius: 4, background: page === totalPages ? '#f5f5f5' : 'white', cursor: page === totalPages ? 'not-allowed' : 'pointer' }}
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Modal */}
            {selectedLog && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999
                }}>
                    <div style={{ background: 'white', padding: 30, borderRadius: 8, width: 600, maxWidth: '90%', maxHeight: '80vh', overflowY: 'auto' }}>
                        <h3 style={{ marginTop: 0 }}>Log Details</h3>
                        <p><strong>ID:</strong> {selectedLog.id}</p>
                        <p><strong>Timestamp:</strong> {new Date(selectedLog.timestamp).toISOString()}</p>
                        <p><strong>Metadata:</strong></p>
                        <pre style={{ background: '#f5f5f5', padding: 15, borderRadius: 4, overflowX: 'auto', fontSize: '0.9rem' }}>
                            {JSON.stringify(selectedLog.metadata, null, 2)}
                        </pre>
                        <button
                            onClick={() => setSelectedLog(null)}
                            style={{ marginTop: 20, padding: '8px 16px', background: '#3182ce', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
