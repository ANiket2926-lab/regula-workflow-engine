const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const api = {
    async post(endpoint: string, body: any, token?: string) {
        const headers: any = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const url = `${API_URL}${endpoint}`;
        console.log(`[API] POST Request to: ${url}`); // Debug Log

        const res = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
        });

        if (!res.ok) {
            const text = await res.text();
            console.error(`[API] Error ${res.status}:`, text);
            try { return JSON.parse(text); } catch { return { success: false, error: `Server returned ${res.status}` }; }
        }

        return res.json();
    },

    async get(endpoint: string, token: string) {
        const headers: any = { 'Authorization': `Bearer ${token}` };
        const url = `${API_URL}${endpoint}`;
        console.log(`[API] GET Request to: ${url}`); // Debug Log

        const res = await fetch(url, {
            method: 'GET',
            headers,
        });

        if (!res.ok) {
            const text = await res.text();
            console.error(`[API] Error ${res.status}:`, text); // Validate if 404/500
            try { return JSON.parse(text); } catch { return { success: false, error: `Invalid JSON from Server (${res.status})` }; }
        }

        return res.json();
    }
};
