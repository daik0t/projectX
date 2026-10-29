import { navigate } from "../../routers";

const KEYS = {
    ACCESS_TOKEN: 'accessToken',
    TOKEN_TYPE:   'tokenType',
    EXPIRES_AT:   'tokenExpiresAt',
    USER:         'user',
};

export function saveAuth({ accessToken, tokenType, expiresIn, user } = {}) {
    if (!accessToken) {
        console.warn('saveAuth: accessToken отсутствует, сохранение пропущено');
        return;
    }

    localStorage.setItem(KEYS.ACCESS_TOKEN, accessToken);
    localStorage.setItem(KEYS.TOKEN_TYPE, tokenType || 'Bearer');

    if (typeof expiresIn === 'number' && expiresIn > 0) {
        const expiresAt = Date.now() + expiresIn * 1000;
        localStorage.setItem(KEYS.EXPIRES_AT, String(expiresAt));
    } else {
        localStorage.removeItem(KEYS.EXPIRES_AT);
    }

    if (user) {
        localStorage.setItem(KEYS.USER, JSON.stringify(user));
    }
}

export function getAuth() {
    const rawUser = localStorage.getItem(KEYS.USER);
    const expiresAtStr = localStorage.getItem(KEYS.EXPIRES_AT);

    return {
        accessToken: localStorage.getItem(KEYS.ACCESS_TOKEN),
        tokenType:   localStorage.getItem(KEYS.TOKEN_TYPE) || 'Bearer',
        expiresAt:   expiresAtStr ? Number(expiresAtStr) : null,
        user:        rawUser ? safeParse(rawUser) : null,
    };
}


export function isTokenExpired(skewMs = 30_000) {
    const { accessToken, expiresAt } = getAuth();
    if (!accessToken) return true;
    if (!expiresAt) return false;               
    return Date.now() + skewMs >= expiresAt;
}

export function clearAuth() {
    Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
    sessionStorage.removeItem(KEYS.ACCESS_TOKEN);
    sessionStorage.removeItem(KEYS.USER);
    navigate("/login")
}

export function getAuthHeader() {
    const { accessToken, tokenType } = getAuth();
    return accessToken ? { Authorization: `${tokenType} ${accessToken}` } : {};
}


function safeParse(json) {
    try {
        return JSON.parse(json);
    } catch {
        return null;
    }
}