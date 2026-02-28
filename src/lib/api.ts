import { supabase } from '@/lib/supabase';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

async function authFetch(endpoint: string, options: RequestInit = {}) {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const headers = new Headers(options.headers);
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }
    headers.set('Content-Type', 'application/json');

    const res = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
    });

    if (!res.ok) {
        let errorMsg = 'API request failed';
        try {
            const errorData = await res.json();
            errorMsg = errorData.error || errorData.message || errorMsg;
        } catch (e) {
            // JSON parse failed, ignore
        }
        throw new Error(errorMsg);
    }

    return res.json();
}

export const api = {
    createCompetitor: (name: string, url: string) =>
        authFetch('/competitors', {
            method: 'POST',
            body: JSON.stringify({ name, url })
        }),
    updateCompetitor: (id: string, name: string, url: string) =>
        authFetch(`/competitors/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ name, url })
        }),
    runScan: () =>
        authFetch('/scan', {
            method: 'POST'
        }),
    getLatestReport: () =>
        authFetch('/reports/latest', {
            method: 'GET'
        }),
    getCompetitor: () =>
        authFetch('/competitors', {
            method: 'GET'
        })
};
