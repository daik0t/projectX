import { saveAuth } from "./auth-storage";

export async function handleAuthCallback() {
    const search = new URLSearchParams(location.search);
    const hash = new URLSearchParams(location.hash.replace(/^#/, ''));

    const token = search.get('token') || hash.get('token');
    const error = search.get('error') || hash.get('error');

    history.replaceState({}, '', location.pathname);

    if (error) {
        throw new Error(decodeURIComponent(error));
    }
    if (!token) {
        throw new Error('Сервер не вернул токен');
    }

    await saveAuth({ accessToken: token });
}

export function isAuthCallback() {
    if (window.location.pathname !== '/oauth/callback') return false;

    const search = new URLSearchParams(location.search);
    const hash = new URLSearchParams(location.hash.replace(/^#/, ''));

    return search.has('token') || search.has('error') || hash.has('token') || hash.has('error');
}
