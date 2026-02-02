'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../utils/api';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await api.post('/auth/login', { email, password });
            if (res.success) {
                localStorage.setItem('token', res.data.token);
                localStorage.setItem('user', JSON.stringify(res.data.user));
                router.push('/dashboard');
            } else {
                setError(res.error || 'Login failed');
            }
        } catch (err) {
            setError('An error occurred');
        }
    };

    return (
        <div style={{ maxWidth: 400, margin: '50px auto', textAlign: 'center' }}>
            <img src="/logo.png" alt="Regula Logo" style={{ width: 120, height: 'auto', marginBottom: 20 }} />
            <h1>Login - Regula</h1>
            {error && <div className="error">{error}</div>}
            <form onSubmit={handleLogin}>
                <div style={{ marginBottom: 10 }}>
                    <label>Email: </label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        style={{ width: '100%', padding: 5 }}
                    />
                </div>
                <div style={{ marginBottom: 10 }}>
                    <label>Password: </label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={{ width: '100%', padding: 5 }}
                    />
                </div>
                <button type="submit">Login</button>
            </form>
            <div style={{ marginTop: 20, textAlign: 'center' }}>
                <a href="/about" style={{ color: '#0070f3', textDecoration: 'none' }}>About Regula</a>
            </div>
        </div>
    );
}
