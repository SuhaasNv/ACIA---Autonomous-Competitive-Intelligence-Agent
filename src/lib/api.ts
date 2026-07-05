const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const TOKEN_KEY = 'signal_auth_token';

export function getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
    localStorage.removeItem(TOKEN_KEY);
}

async function authFetch(endpoint: string, options: RequestInit = {}) {
    const token = getToken();

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
        } catch {
            // JSON parse failed, use status text
            errorMsg = res.statusText || errorMsg;
        }
        throw new Error(errorMsg);
    }

    return res.json();
}

export const api = {
    register: (email: string, password: string) =>
        authFetch('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        }),
    login: (email: string, password: string) =>
        authFetch('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        }),
    getMe: () =>
        authFetch('/auth/me', {
            method: 'GET'
        }),
    getProfile: () =>
        authFetch('/profile', {
            method: 'GET'
        }),
    createProfile: (fullName: string, companyName: string, companyUrl: string) =>
        authFetch('/profile', {
            method: 'POST',
            body: JSON.stringify({ fullName, companyName, companyUrl })
        }),
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
