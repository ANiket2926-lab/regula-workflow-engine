'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '../../../utils/api';

// Helper to Calculate SLA Status
function useSLAWait(workflow: any) {
    const [timeLeft, setTimeLeft] = useState<string>('');
    const [isBreached, setIsBreached] = useState(false);

    useEffect(() => {
        if (!workflow || !workflow.template || workflow.status === 'EXECUTED' || workflow.status === 'REJECTED') {
            setTimeLeft('');
            return;
        }

        const steps = JSON.parse(workflow.template.steps);
        const currentStep = steps[workflow.currentStep];
        const slaHours = currentStep.slaHours || 24;
        const startTime = new Date(workflow.stepStartTime).getTime();
        const deadline = startTime + slaHours * 60 * 60 * 1000;

        const interval = setInterval(() => {
            const now = new Date().getTime();
            const diff = deadline - now;

            if (diff <= 0) {
                setTimeLeft('SLA Breached');
                setIsBreached(true);
            } else {
                const h = Math.floor(diff / (1000 * 60 * 60));
                const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                setTimeLeft(`${h}h ${m}m remaining`);
                setIsBreached(false);
            }
        }, 60000); // Update every minute

        // Initial Set
        const now = new Date().getTime();
        const diff = deadline - now;
        if (diff <= 0) { setTimeLeft('SLA Breached'); setIsBreached(true); }
        else {
            const h = Math.floor(diff / (1000 * 60 * 60));
            const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            setTimeLeft(`${h}h ${m}m remaining`);
            setIsBreached(false);
        }

        return () => clearInterval(interval);
    }, [workflow]);

    return { timeLeft, isBreached };
}

export default function WorkflowDetail() {
    const { id } = useParams();
    const [workflow, setWorkflow] = useState<any>(null);
    const [user, setUser] = useState<any>(null);
    const [comment, setComment] = useState('');
    const [activeTab, setActiveTab] = useState<'details' | 'logs'>('details');
    const [logs, setLogs] = useState<any[]>([]);
    const router = useRouter();

    // Hook must be inside component, but workflow might be null initially
    // We'll wrap logic or pass null
    const { timeLeft, isBreached } = useSLAWait(workflow);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        if (!token) return router.push('/login');
        setUser(JSON.parse(userData!));

        api.get(`/workflows/${id}`, token)
            .then(res => {
                if (res.success) setWorkflow(res.data);
                else alert(res.error);
            });
    }, [id, router]);

    // Fetch logs when tab changes to 'logs'
    useEffect(() => {
        if (activeTab === 'logs' && logs.length === 0) {
            const token = localStorage.getItem('token');
            api.get(`/workflows/${id}/logs`, token!)
                .then(res => {
                    if (res.success) setLogs(res.data);
                });
        }
    }, [activeTab, id, logs.length]);

    const handleTransition = async (action: string) => {
        const token = localStorage.getItem('token');
        const res = await api.post(`/workflows/${id}/transition`, { action, comment }, token!);
        if (res.success) {
            setWorkflow(res.data); // Update state
            setComment(''); // Clear comment
            // Refresh logs if active
            if (activeTab === 'logs') {
                api.get(`/workflows/${id}/logs`, token!).then(r => r.success && setLogs(r.data));
            }
        } else {
            alert(`Error: ${res.error}`);
        }
    };

    if (!workflow) return <div>Loading...</div>;

    const showEscalation = workflow.isEscalated || isBreached;

    // Status Colors Helpers
    const getStatusColor = (status: string, escalated: boolean) => {
        if (escalated) return { bg: '#fff5f5', color: '#c53030', border: '#feb2b2' };
        switch (status) {
            case 'APPROVED': return { bg: '#f0fff4', color: '#2f855a', border: '#9ae6b4' };
            case 'EXECUTED': return { bg: '#e9d8fd', color: '#6b46c1', border: '#d6bcfa' };
            case 'REJECTED': return { bg: '#fff5f5', color: '#c53030', border: '#feb2b2' };
            case 'SUBMITTED': return { bg: '#ebf8ff', color: '#3182ce', border: '#bee3f8' };
            default: return { bg: '#edf2f7', color: '#4a5568', border: '#cbd5e0' };
        }
    };

    const statusStyle = getStatusColor(workflow.status, showEscalation);

    return (
        <div style={{ maxWidth: 1000, margin: '40px auto', padding: '0 20px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>

            {/* Header & Nav */}
            <div style={{ marginBottom: 20 }}>
                <button
                    onClick={() => router.push('/dashboard')}
                    style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: '0.9em', padding: 0 }}
                >
                    &larr; Back to Dashboard
                </button>
            </div>

            {/* Title & Status Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 30 }}>
                <div>
                    <div style={{ fontSize: '0.85em', textTransform: 'uppercase', color: '#888', letterSpacing: '0.5px', marginBottom: 5 }}>
                        Workflow ID: {workflow.id}
                    </div>
                    <h1 style={{ margin: 0, fontSize: '2em', fontWeight: 700, color: '#1a202c' }}>{workflow.title}</h1>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{
                        display: 'inline-block',
                        padding: '6px 16px',
                        borderRadius: 30,
                        fontWeight: 700,
                        backgroundColor: statusStyle.bg,
                        color: statusStyle.color,
                        border: `1px solid ${statusStyle.border}`,
                        fontSize: '0.9em',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.03)'
                    }}>
                        {showEscalation ? 'ESCALATED' : workflow.status}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: 20 }}>
                <button
                    onClick={() => setActiveTab('details')}
                    style={{
                        padding: '10px 20px', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600,
                        color: activeTab === 'details' ? '#3182ce' : '#718096',
                        borderBottom: activeTab === 'details' ? '2px solid #3182ce' : 'none'
                    }}
                >
                    Overview
                </button>
                <button
                    onClick={() => setActiveTab('logs')}
                    style={{
                        padding: '10px 20px', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600,
                        color: activeTab === 'logs' ? '#3182ce' : '#718096',
                        borderBottom: activeTab === 'logs' ? '2px solid #3182ce' : 'none'
                    }}
                >
                    System Logs
                </button>
            </div>

            {activeTab === 'details' && (
                <>
                    {/* Main Content Info */}
                    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #eaeaea', padding: 30, marginBottom: 30, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                        <div style={{ marginBottom: 25 }}>
                            <h3 style={{ marginTop: 0, fontSize: '1.1em', color: '#4a5568', borderBottom: '1px solid #f0f0f0', paddingBottom: 10, marginBottom: 15 }}>Details</h3>
                            <p style={{ fontSize: '1.1em', lineHeight: 1.6, color: '#2d3748' }}>{workflow.description}</p>
                            <div style={{ marginTop: 20, display: 'flex', gap: 40, fontSize: '0.95em', color: '#4a5568' }}>
                                <div>
                                    <span style={{ fontWeight: 600, display: 'block', fontSize: '0.85em', textTransform: 'uppercase', color: '#a0aec0' }}>Requester</span>
                                    {workflow.requester?.email}
                                </div>
                                <div>
                                    <span style={{ fontWeight: 600, display: 'block', fontSize: '0.85em', textTransform: 'uppercase', color: '#a0aec0' }}>Created At</span>
                                    {new Date(workflow.createdAt).toLocaleString()}
                                </div>
                                {showEscalation && (
                                    <div>
                                        <span style={{ fontWeight: 600, display: 'block', fontSize: '0.85em', textTransform: 'uppercase', color: '#e53e3e' }}>SLA Status</span>
                                        <span style={{ fontWeight: 'bold', color: '#e53e3e' }}>Breached</span>
                                    </div>
                                )}
                                {timeLeft && !showEscalation && (
                                    <div>
                                        <span style={{ fontWeight: 600, display: 'block', fontSize: '0.85em', textTransform: 'uppercase', color: '#3182ce' }}>SLA Remaining</span>
                                        <span style={{ fontWeight: '700', color: '#3182ce' }}>{timeLeft}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {workflow.template && (
                            <div style={{ marginBottom: 10 }}>
                                <h3 style={{ marginTop: 0, fontSize: '1.1em', color: '#4a5568', borderBottom: '1px solid #f0f0f0', paddingBottom: 15, marginBottom: 20 }}>Workflow Progress</h3>
                                <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                    {JSON.parse(workflow.template.steps).map((step: any, idx: number, arr: any[]) => {
                                        const isCompleted = idx < workflow.currentStep || workflow.status === 'EXECUTED';
                                        const isCurrent = idx === workflow.currentStep && workflow.status === 'SUBMITTED';
                                        const isPending = !isCompleted && !isCurrent;

                                        return (
                                            <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                                                {/* Connecting Line */}
                                                {idx > 0 && (
                                                    <div style={{
                                                        position: 'absolute',
                                                        top: 15,
                                                        left: '-50%',
                                                        width: '100%',
                                                        height: 2,
                                                        background: isCompleted ? '#48bb78' : '#e2e8f0',
                                                        zIndex: 0
                                                    }} />
                                                )}

                                                {/* Circle */}
                                                <div style={{
                                                    width: 32,
                                                    height: 32,
                                                    borderRadius: '50%',
                                                    background: isCompleted ? '#48bb78' : (isCurrent ? (showEscalation ? '#e53e3e' : '#3182ce') : '#fff'),
                                                    border: `2px solid ${isCompleted ? '#48bb78' : (isCurrent ? (showEscalation ? '#e53e3e' : '#3182ce') : '#cbd5e0')}`,
                                                    color: isPending ? '#cbd5e0' : '#fff',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontWeight: 'bold',
                                                    zIndex: 1,
                                                    marginBottom: 10,
                                                    transition: 'all 0.3s'
                                                }}>
                                                    {idx + 1}
                                                </div>
                                                <div style={{ textAlign: 'center' }}>
                                                    <div style={{ fontSize: '0.9em', fontWeight: 600, color: isCurrent ? '#2d3748' : '#718096' }}>{step.name}</div>
                                                    <div style={{ fontSize: '0.75em', color: '#a0aec0' }}>{step.role}</div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Actions Card */}
                    {(user?.role === 'REQUESTER' && workflow.status === 'DRAFT') ||
                        (user?.role === 'REVIEWER' && workflow.status === 'SUBMITTED' && !workflow.template) ||
                        (user?.role === 'EXECUTOR' && workflow.status === 'APPROVED' && !workflow.template) ||
                        (workflow.template && workflow.status === 'SUBMITTED' && JSON.parse(workflow.template.steps)[workflow.currentStep].role === user?.role) ? (
                        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #d6bcfa', padding: 25, marginBottom: 30, boxShadow: '0 4px 15px rgba(107, 70, 193, 0.08)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
                                <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#805ad5', marginRight: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.8em' }}>!</div>
                                <h3 style={{ margin: 0, fontSize: '1.2em', color: '#553c9a' }}>Action Required</h3>
                            </div>

                            {/* Common Action Area */}
                            <div style={{ paddingLeft: 30 }}>
                                {user?.role === 'REQUESTER' && workflow.status === 'DRAFT' && (
                                    <button onClick={() => handleTransition('SUBMIT')}
                                        style={{ padding: '10px 24px', background: '#3182ce', color: 'white', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}>
                                        Submit for Approval
                                    </button>
                                )}

                                {(['REVIEWER', 'EXECUTOR'].includes(user?.role) || (workflow.template && JSON.parse(workflow.template.steps)[workflow.currentStep].role === user?.role)) && (
                                    <div>
                                        <textarea
                                            placeholder="Enter your comments or justification here..."
                                            value={comment}
                                            onChange={e => setComment(e.target.value)}
                                            style={{ width: '100%', padding: 12, borderRadius: 6, border: '1px solid #cbd5e0', minHeight: 80, marginBottom: 15, fontFamily: 'inherit' }}
                                        />
                                        <div style={{ display: 'flex', gap: 15 }}>
                                            <button
                                                onClick={() => handleTransition(user.role === 'EXECUTOR' && !workflow.template ? 'EXECUTE' : 'APPROVE')}
                                                disabled={!comment.trim()}
                                                style={{
                                                    padding: '10px 24px',
                                                    background: !comment.trim() ? '#cbd5e0' : '#48bb78',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: 6,
                                                    fontWeight: 600,
                                                    cursor: !comment.trim() ? 'not-allowed' : 'pointer'
                                                }}
                                                title={!comment.trim() ? "Comment is required to proceed" : ""}
                                            >
                                                {user.role === 'EXECUTOR' && !workflow.template ? 'Execute' : (workflow.template ? 'Approve & Advance' : 'Approve')}
                                            </button>

                                            {(user.role === 'REVIEWER' || (workflow.template && workflow.status !== 'APPROVED')) && (
                                                <button
                                                    onClick={() => handleTransition('REJECT')}
                                                    disabled={!comment.trim()}
                                                    style={{
                                                        padding: '10px 24px',
                                                        background: !comment.trim() ? '#cbd5e0' : '#e53e3e',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: 6,
                                                        fontWeight: 600,
                                                        cursor: !comment.trim() ? 'not-allowed' : 'pointer'
                                                    }}
                                                    title={!comment.trim() ? "Comment is required to reject" : ""}
                                                >
                                                    Reject
                                                </button>
                                            )}
                                        </div>
                                        {!comment.trim() && <div style={{ marginTop: 8, fontSize: '0.85em', color: '#718096' }}>* Comments are mandatory for all actions.</div>}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        // Passive Status Message
                        workflow.status !== 'EXECUTED' && workflow.status !== 'REJECTED' && (
                            <div style={{ padding: 20, background: '#f7fafc', borderRadius: 8, border: '1px dashed #cbd5e0', marginBottom: 30, color: '#718096', textAlign: 'center' }}>
                                Waiting for action by <strong>{workflow.template ? JSON.parse(workflow.template.steps)[workflow.currentStep].role : (workflow.status === 'SUBMITTED' ? 'REVIEWER' : 'EXECUTOR')}</strong>
                            </div>
                        )
                    )}
                </>
            )}

            {/* Logs Tab Content */}
            {activeTab === 'logs' && (
                <div style={{ marginTop: 20 }}>
                    <div style={{ background: '#fff', border: '1px solid #eaeaea', borderRadius: 8, overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ background: '#f9fafb', borderBottom: '1px solid #eaeaea' }}>
                                <tr>
                                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.8rem', textTransform: 'uppercase', color: '#718096' }}>Time</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.8rem', textTransform: 'uppercase', color: '#718096' }}>Event</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.8rem', textTransform: 'uppercase', color: '#718096' }}>Actor</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.8rem', textTransform: 'uppercase', color: '#718096' }}>Status</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.8rem', textTransform: 'uppercase', color: '#718096' }}>Message</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.length === 0 ? (
                                    <tr><td colSpan={5} style={{ padding: 20, textAlign: 'center', color: '#aaa' }}>No logs found for this workflow.</td></tr>
                                ) : (
                                    logs.map((log) => (
                                        <tr key={log.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                            <td style={{ padding: '12px 16px', fontSize: '0.9rem', color: '#4a5568' }}>
                                                {new Date(log.timestamp).toLocaleString()}
                                            </td>
                                            <td style={{ padding: '12px 16px', fontSize: '0.9rem', fontWeight: 600 }}>{log.eventType}</td>
                                            <td style={{ padding: '12px 16px', fontSize: '0.9rem' }}>
                                                {log.actorEmail} <span style={{ fontSize: '0.75rem', color: '#718096', background: '#edf2f7', padding: '2px 4px', borderRadius: 4 }}>{log.actorRole}</span>
                                            </td>
                                            <td style={{ padding: '12px 16px', fontSize: '0.9rem' }}>
                                                <span style={{
                                                    color: log.status === 'SUCCESS' ? '#2f855a' : '#c53030',
                                                    fontWeight: 600
                                                }}>
                                                    {log.status}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px 16px', fontSize: '0.9rem', color: '#2d3748' }}>{log.message}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'details' && (
                <>
                    {/* Vertical Audit Timeline (Keep existing within details tab) */}
                    <div style={{ marginTop: 40 }}>
                        <h3 style={{ fontSize: '1.2em', color: '#2d3748', marginBottom: 20 }}>Audit Timeline</h3>
                        <div style={{ position: 'relative', paddingLeft: 20 }}>
                            {/* Vertical Line */}
                            <div style={{ position: 'absolute', left: 27, top: 10, bottom: 20, width: 2, background: '#e2e8f0' }}></div>

                            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                {workflow.auditLogs?.map((log: any) => {
                                    const badgeColors: any = {
                                        CREATE: { bg: '#edf2f7', color: '#4a5568' },
                                        SUBMIT: { bg: '#ebf8ff', color: '#3182ce' },
                                        APPROVE: { bg: '#f0fff4', color: '#2f855a' },
                                        REJECT: { bg: '#fff5f5', color: '#c53030' },
                                        EXECUTE: { bg: '#e9d8fd', color: '#6b46c1' },
                                        ESCALATION: { bg: '#c53030', color: '#fff' }
                                    };
                                    const style = badgeColors[log.action] || { bg: '#eee', color: '#333' };

                                    return (
                                        <li key={log.id} style={{ marginBottom: 25, position: 'relative', paddingLeft: 30 }}>
                                            {/* Dot */}
                                            <div style={{
                                                position: 'absolute',
                                                left: 0,
                                                top: 0,
                                                width: 16,
                                                height: 16,
                                                borderRadius: '50%',
                                                background: '#fff',
                                                border: `3px solid ${style.color}`,
                                                zIndex: 1
                                            }}></div>

                                            {/* Content Card */}
                                            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 15, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                                    <div>
                                                        <span style={{
                                                            fontSize: '0.75em',
                                                            fontWeight: 700,
                                                            padding: '3px 8px',
                                                            borderRadius: 4,
                                                            background: style.bg,
                                                            color: style.color,
                                                            marginRight: 10
                                                        }}>
                                                            {log.action}
                                                        </span>
                                                        <span style={{ fontSize: '0.85em', color: '#718096' }}>
                                                            {new Date(log.timestamp).toLocaleDateString()} at {new Date(log.timestamp).toLocaleTimeString()}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 5 }}>
                                                    <div style={{ fontWeight: 600, color: '#2d3748', fontSize: '0.95em' }}>{log.performedByEmail}</div>
                                                    <div style={{ marginLeft: 8, fontSize: '0.85em', color: '#a0aec0', background: '#f7fafc', padding: '2px 6px', borderRadius: 4 }}>{log.performedByRole}</div>
                                                </div>

                                                <div style={{ fontSize: '0.9em', color: '#4a5568' }}>
                                                    Transitioned from <strong>{log.fromStatus || 'Start'}</strong> &rarr; <strong>{log.toStatus}</strong>
                                                </div>

                                                {log.comment && (
                                                    <div style={{ marginTop: 10, padding: 10, background: '#f8fafc', borderLeft: '3px solid #cbd5e0', fontSize: '0.9em', color: '#4a5568', fontStyle: 'italic' }}>
                                                        "{log.comment}"
                                                    </div>
                                                )}
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    </div>
                </>
            )}

        </div>
    );
}
