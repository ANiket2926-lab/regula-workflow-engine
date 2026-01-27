'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../utils/api';

export default function Dashboard() {
    const [workflows, setWorkflows] = useState<any[]>([]);
    const [templates, setTemplates] = useState<any[]>([]);
    const [user, setUser] = useState<any>(null);
    const [showCreate, setShowCreate] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (!token || !userData) {
            router.push('/login');
            return;
        }

        setUser(JSON.parse(userData));

        // Fetch Workflows
        api.get('/workflows', token)
            .then(res => {
                if (res.success) setWorkflows(res.data);
            })
            .catch(err => console.error(err));

        // Fetch Templates
        api.get('/templates', token)
            .then(res => {
                if (res.success) setTemplates(res.data);
            })
            .catch(console.error);
    }, [router]);

    const createWorkflow = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const payload: any = { title: newTitle, description: newDesc };
        if (selectedTemplate) payload.templateId = selectedTemplate;

        const res = await api.post('/workflows', payload, token!);
        if (res.success) {
            setWorkflows([...workflows, res.data]);
            setShowCreate(false);
            setNewTitle('');
            setNewDesc('');
            setSelectedTemplate('');
        } else {
            alert(res.error);
        }
    };

    return (
        <div style={{ padding: '20px 40px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30, borderBottom: '1px solid #eaeaea', paddingBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <h1 style={{ margin: 0, fontWeight: 600, color: '#111' }}>Dashboard</h1>
                    <span style={{ marginLeft: 15, padding: '4px 8px', backgroundColor: '#f0f0f0', borderRadius: 4, fontSize: '0.85em', color: '#666' }}>
                        {user?.role} View
                    </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                    <button onClick={() => router.push('/about')} style={{ background: 'none', border: 'none', color: '#0070f3', cursor: 'pointer', fontSize: '1em' }}>About</button>
                    <div style={{ textAlign: 'right', fontSize: '0.9em' }}>
                        <div style={{ fontWeight: 600 }}>{user?.email}</div>
                    </div>
                    {user?.role === 'ADMIN' && (
                        <button
                            onClick={() => router.push('/admin')}
                            style={{ background: '#000', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontWeight: 600 }}
                        >
                            Admin Panel
                        </button>
                    )}
                    <button
                        onClick={() => { localStorage.clear(); router.push('/login'); }}
                        style={{
                            padding: '8px 16px',
                            borderRadius: 6,
                            border: '1px solid #ddd',
                            background: '#fff',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        Logout
                    </button>
                </div>
            </div>

            {user?.role === 'REQUESTER' && (
                <div style={{ marginBottom: 30 }}>
                    {!showCreate ? (
                        <button
                            onClick={() => setShowCreate(true)}
                            style={{
                                padding: '10px 20px',
                                background: '#0070f3',
                                color: 'white',
                                border: 'none',
                                borderRadius: 6,
                                fontWeight: 600,
                                cursor: 'pointer',
                                boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                            }}
                        >
                            + Create New Workflow
                        </button>
                    ) : (
                        <div style={{ background: '#fff', border: '1px solid #eaeaea', borderRadius: 8, padding: 25, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', maxWidth: 500 }}>
                            <h3 style={{ marginTop: 0, marginBottom: 20 }}>New Workflow</h3>
                            <form onSubmit={createWorkflow}>
                                <div style={{ marginBottom: 15 }}>
                                    <label style={{ display: 'block', marginBottom: 5, fontWeight: 500, fontSize: '0.9em' }}>Title</label>
                                    <input required value={newTitle} onChange={e => setNewTitle(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc', fontSize: '1em' }} />
                                </div>
                                <div style={{ marginBottom: 15 }}>
                                    <label style={{ display: 'block', marginBottom: 5, fontWeight: 500, fontSize: '0.9em' }}>Description</label>
                                    <textarea required value={newDesc} onChange={e => setNewDesc(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc', fontSize: '1em', minHeight: 80 }} />
                                </div>
                                <div style={{ marginBottom: 20 }}>
                                    <label style={{ display: 'block', marginBottom: 5, fontWeight: 500, fontSize: '0.9em' }}>Template</label>
                                    <select value={selectedTemplate} onChange={e => setSelectedTemplate(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc', fontSize: '1em' }}>
                                        <option value="">Legacy (Reviewer -&gt; Executor)</option>
                                        {templates.map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div style={{ display: 'flex', gap: 10 }}>
                                    <button type="submit" style={{ padding: '8px 20px', background: '#0070f3', color: 'white', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}>Create</button>
                                    <button type="button" onClick={() => setShowCreate(false)} style={{ padding: '8px 20px', background: '#f5f5f5', color: '#333', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            )}

            <div style={{ background: '#fff', border: '1px solid #eaeaea', borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#f9fafb', borderBottom: '1px solid #eaeaea' }}>
                            <th style={{ padding: '15px 20px', textAlign: 'left', fontWeight: 600, fontSize: '0.85em', textTransform: 'uppercase', color: '#666' }}>ID</th>
                            <th style={{ padding: '15px 20px', textAlign: 'left', fontWeight: 600, fontSize: '0.85em', textTransform: 'uppercase', color: '#666' }}>Title</th>
                            <th style={{ padding: '15px 20px', textAlign: 'left', fontWeight: 600, fontSize: '0.85em', textTransform: 'uppercase', color: '#666' }}>Status</th>
                            <th style={{ padding: '15px 20px', textAlign: 'left', fontWeight: 600, fontSize: '0.85em', textTransform: 'uppercase', color: '#666' }}>Requester</th>
                            <th style={{ padding: '15px 20px', textAlign: 'right', fontWeight: 600, fontSize: '0.85em', textTransform: 'uppercase', color: '#666' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {workflows.map(wf => {
                            const statusColors: any = {
                                DRAFT: '#6c757d',
                                SUBMITTED: '#007bff',
                                APPROVED: '#28a745',
                                REJECTED: '#dc3545',
                                EXECUTED: '#6f42c1',
                                ESCALATED: '#dc3545'
                            };
                            const statusColor = wf.isEscalated ? '#dc3545' : (statusColors[wf.status] || '#333');
                            const statusLabel = wf.isEscalated ? 'ESCALATED' : wf.status;

                            return (
                                <tr key={wf.id} style={{ borderBottom: '1px solid #f0f0f0', transition: 'background 0.1s' }} className="hover-row">
                                    <td style={{ padding: '15px 20px', fontSize: '0.9em', color: '#666', fontFamily: 'monospace' }}>{wf.id.substring(0, 8)}</td>
                                    <td style={{ padding: '15px 20px', fontWeight: 500 }}>{wf.title}</td>
                                    <td style={{ padding: '15px 20px' }}>
                                        <span style={{
                                            padding: '4px 10px',
                                            borderRadius: 20,
                                            backgroundColor: `${statusColor}20`,
                                            color: statusColor,
                                            fontWeight: 600,
                                            fontSize: '0.8em'
                                        }}>
                                            {statusLabel}
                                        </span>
                                    </td>
                                    <td style={{ padding: '15px 20px', color: '#555' }}>{wf.requester?.email || wf.requesterId}</td>
                                    <td style={{ padding: '15px 20px', textAlign: 'right' }}>
                                        <button
                                            onClick={() => router.push(`/workflows/${wf.id}`)}
                                            style={{
                                                padding: '6px 12px',
                                                border: '1px solid #d0d7de',
                                                borderRadius: 6,
                                                background: '#fff',
                                                fontSize: '0.9em',
                                                cursor: 'pointer',
                                                color: '#24292f',
                                                fontWeight: 500
                                            }}
                                        >
                                            View
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {workflows.length === 0 && (
                    <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>
                        No workflows found.
                    </div>
                )}
            </div>
        </div>
    );
}
