import {
    getSession,
    saveSession,
    clearSession,
    isSessionExpired,
    getAuthHeader,
    getJwtExpiresAt,
} from "./session";
import { me } from "../api/auth";


export async function saveAuth({ accessToken, tokenType, expiresIn, expiresAt, user } = {}) {
    if (!accessToken) {
        throw new Error("Сервер не вернул токен");
    }

    const jwtExpiresAt = getJwtExpiresAt(accessToken);

    saveSession({
        accessToken,
        tokenType,
        expiresIn,
        expiresAt: expiresAt ?? jwtExpiresAt,
        user,
    });

    if (!user) {
        try {
            const userData = await me();
            saveSession({ user: userData });
        } catch (err) {
            clearSession();
            throw err;
        }
    }
}

export function getAuth() {
    return getSession();
}

export function isTokenExpired(skewMs) {
    return isSessionExpired(skewMs);
}

export function clearAuth() {
    clearSession();
}

export { getAuthHeader };
