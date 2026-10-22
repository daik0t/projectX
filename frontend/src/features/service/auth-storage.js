const KEYS = {
    ACCESS_TOKEN: 'accessToken',
    TOKEN_TYPE:   'tokenType',
    EXPIRES_AT:   'tokenExpiresAt',
    USER:         'user',
};

/**
 * Сохраняет данные авторизации после успешного логина.
 *
 * @param {Object} authData
 * @param {string} authData.accessToken  — JWT / opaque token
 * @param {string} [authData.tokenType]  — обычно "Bearer"
 * @param {number} [authData.expiresIn]  — время жизни в СЕКУНДАХ (как в OAuth 2.0)
 * @param {Object} [authData.user]       — объект пользователя
 */
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

/**
 * Возвращает сохранённые данные авторизации.
 * @returns {{accessToken: string|null, tokenType: string, expiresAt: number|null, user: Object|null}}
 */
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

/**
 * Проверяет, истёк ли токен. Возвращает true, если токена нет или он протух.
 */
export function isTokenExpired(skewMs = 30_000) {
    const { accessToken, expiresAt } = getAuth();
    if (!accessToken) return true;
    if (!expiresAt) return false;               
    return Date.now() + skewMs >= expiresAt;
}

/**
 * Полностью очищает данные авторизации.
 */
export function clearAuth() {
    Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
}

/**
 * Возвращает готовый заголовок Authorization для fetch/axios.
 */
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