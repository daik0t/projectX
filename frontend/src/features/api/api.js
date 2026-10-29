import { saveAuth } from "../service/auth-storage";

const API_BASE_URL = 'http://localhost:8080';

export async function request(path, options = {}) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {}),
        },
        ...options,
    });

    let data = null;
    try {
        data = await response.json();
    } catch {

    }

    if (!response.ok) {
        const message = data?.message || data?.error || `Ошибка ${response.status}`;
        throw new Error(message);
    }

    return data;
}

export async function startProviderAuth(provider) {
    if (provider !== 'google' && provider !== 'github') {
        throw new Error(`Unknown provider: ${provider}`);
    }
    window.location.href = `${API_BASE_URL}/oauth2/authorization/${provider}`;
}

export async function handleAuthCallback() {
    const search = new URLSearchParams(location.search);
    const hash   = new URLSearchParams(location.hash.replace(/^#/, ''));

    const token = search.get('token') || hash.get('token');
    const error = search.get('error') || hash.get('error');

    history.replaceState({}, '', location.pathname);

    if (error) {
        throw new Error(decodeURIComponent(error));
    }
    if (!token) {
        throw new Error('Сервер не вернул токен');
    }
    

    saveAuth({ accessToken: token });
}

export function isAuthCallback() {
    const path = window.location.pathname;
    if (path !== '/oauth/callback') {
        return false;
    }

    const search = new URLSearchParams(location.search);
    const hash = new URLSearchParams(location.hash.replace(/^#/, ''));

        
    return search.has('token') || search.has('error') || hash.has('token') || hash.has('error');
}
    
    
