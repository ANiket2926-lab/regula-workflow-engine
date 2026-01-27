import React from 'react';

export default function AboutPage() {
    return (
        <div style={{ maxWidth: 800, margin: '40px auto', padding: '0 20px', fontFamily: 'sans-serif', lineHeight: 1.6 }}>

            <header style={{ marginBottom: 40, borderBottom: '1px solid #eaeaea', paddingBottom: 20 }}>
                <h1 style={{ margin: 0 }}>Regula: Workflow Governance Engine</h1>
                <p style={{ color: '#666', fontSize: '1.2em' }}>Enterprise-grade approval system strict role separation and immutable auditing.</p>
            </header>

            <section style={{ marginBottom: 40 }}>
                <h2>1. The Problem</h2>
                <p>
                    In high-compliance environments, manual approvals via email or generic ticketing systems often fail to provide:
                </p>
                <ul>
                    <li><strong>Traceability:</strong> Who actually approved this? When?</li>
                    <li><strong>Accountability:</strong> Why was this approved or rejected?</li>
                    <li><strong>Safety:</strong> Preventing a single user from creating and executing a sensitive transaction (Segregation of Duties).</li>
                </ul>
            </section>

            <section style={{ marginBottom: 40 }}>
                <h2>2. The Solution</h2>
                <p>
                    Regula solves this by implementing a <strong>Role-Based Workflow Engine</strong> where state transitions (Draft &rarr; Submitted &rarr; Approved &rarr; Executed) are enforced by code, not policy.
                </p>
                <p>
                    It removes human error from the process logic. If the code says a Requester cannot Approve, they simply cannot.
                </p>
            </section>

            <section style={{ marginBottom: 40 }}>
                <h2>3. Key Features</h2>
                <ul style={{ listStyleType: 'circle' }}>
                    <li><strong>Immutable Audit Trail:</strong> Every action is recorded permanently. History cannot be rewritten.</li>
                    <li><strong>Role-Based Access Control (RBAC):</strong> Strict enforcement of Requester, Reviewer, and Executor roles.</li>
                    <li><strong>Mandatory Justification:</strong> Reviewers are forced to provide comments for every decision.</li>
                    <li><strong>Execution Separation:</strong> The person who requests cannot approve, and the person who approves cannot execute.</li>
                </ul>
            </section>

            <section style={{ marginBottom: 40 }}>
                <h2>4. Who This Is For</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    <div style={{ padding: 15, background: '#f9f9f9', borderRadius: 8 }}>
                        <strong>Internal Tooling Teams</strong>
                        <p style={{ margin: '5px 0 0', fontSize: '0.9em' }}>Building back-office operational tools.</p>
                    </div>
                    <div style={{ padding: 15, background: '#f9f9f9', borderRadius: 8 }}>
                        <strong>Compliance-Heavy Orgs</strong>
                        <p style={{ margin: '5px 0 0', fontSize: '0.9em' }}>FinTech, Healthcare, and Legal sectors requiring SOC2/ISO audits.</p>
                    </div>
                    <div style={{ padding: 15, background: '#f9f9f9', borderRadius: 8 }}>
                        <strong>Finance Operations</strong>
                        <p style={{ margin: '5px 0 0', fontSize: '0.9em' }}>AP/AR approvals, payroll runs, and sensitive data changes.</p>
                    </div>
                </div>
            </section>

            <footer style={{ marginTop: 60, paddingTop: 20, borderTop: '1px solid #eaeaea', textAlign: 'center', color: '#888', fontSize: '0.9em' }}>
                <p>&copy; 2026 CoreviaLabs</p>
                <p>
                    <a href="/login" style={{ color: '#0070f3', textDecoration: 'none' }}>Go to Login</a>
                </p>
            </footer>

        </div>
    );
}
