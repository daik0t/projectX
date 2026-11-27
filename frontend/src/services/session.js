
const KEYS = {
    ACCESS_TOKEN: 'accessToken',
    TOKEN_TYPE: 'tokenType',
    EXPIRES_AT: 'tokenExpiresAt',
    USER: 'user',
};

export function getSession() {
    const rawUser = localStorage.getItem(KEYS.USER);
    const rawExpiresAt = localStorage.getItem(KEYS.EXPIRES_AT);
    const parsedExpiresAt = rawExpiresAt ? Number(rawExpiresAt) : null;

    return {
        accessToken: localStorage.getItem(KEYS.ACCESS_TOKEN),
        tokenType: localStorage.getItem(KEYS.TOKEN_TYPE) || 'Bearer',
        expiresAt: Number.isFinite(parsedExpiresAt) ? parsedExpiresAt : null,
        user: rawUser ? safeParse(rawUser) : null,
    };
}

export function getAccessToken() {
    return localStorage.getItem(KEYS.ACCESS_TOKEN);
}

export function getCurrentUser() {
    return getSession().user;
}

export function getCurrentUserId() {
    return getCurrentUser()?.id ?? null;
}

export function saveSession({ accessToken, tokenType, expiresIn, expiresAt, user } = {}) {
    if (accessToken) {
        localStorage.setItem(KEYS.ACCESS_TOKEN, accessToken);
        localStorage.setItem(KEYS.TOKEN_TYPE, tokenType || 'Bearer');
    }

    const hasExpiry =
        typeof expiresAt === 'number' ||
        (typeof expiresIn === 'number' && expiresIn > 0);

    if (hasExpiry) {
        const value = typeof expiresAt === 'number'
            ? expiresAt
            : Date.now() + expiresIn * 1000;
        localStorage.setItem(KEYS.EXPIRES_AT, String(value));
    }

    if (user !== undefined) {
        if (user) localStorage.setItem(KEYS.USER, JSON.stringify(user));
        else localStorage.removeItem(KEYS.USER);
    }
}

export function clearSession() {
    Object.values(KEYS).forEach((key) => localStorage.removeItem(key));
}

export function isSessionExpired(skewMs = 30_000) {
    const { accessToken, expiresAt } = getSession();
    if (!accessToken) return true;
    if (!expiresAt) return false;
    return Date.now() + skewMs >= expiresAt;
}

export function getJwtExpiresAt(token) {
    if (typeof token !== 'string') return null;

    const payloadPart = token.split('.')[1];
    if (!payloadPart) return null;

    try {
        const base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
        const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
        const payload = JSON.parse(atob(padded));
        return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
    } catch {
        return null;
    }
}

function safeParse(json) {
    try {
        return JSON.parse(json);
    } catch {
        return null;
    }
}
