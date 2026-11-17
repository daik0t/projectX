import { getAccessToken, clearSession } from "../services/session";
import { API_BASE_URL, OAUTH_BASE_URL } from "../lib/config";

export const AUTH_EVENT = "auth:unauthorized";

export class ApiError extends Error {
    constructor(message, { status = 0, details = null } = {}) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.details = details;
    }
}


export async function request(path, {
    method = "GET",
    body,
    headers = {},
    auth = true,
    timeoutMs = 15000,
} = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const token = auth ? getAccessToken() : null;

    try {
        const response = await fetch(`${API_BASE_URL}${path}`, {
            method,
            headers: {
                ...(body != null ? { "Content-Type": "application/json" } : {}),
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                ...headers,
            },
            body: body == null ? undefined : (typeof body === "string" ? body : JSON.stringify(body)),
            signal: controller.signal,
        });

        const data = response.status === 204
            ? null
            : await response.json().catch(() => null);

        if (!response.ok) {
            const message = data?.message || data?.error || `Ошибка ${response.status}`;
            const error = new ApiError(message, {
                status: response.status,
                details: data?.details ?? null,
            });

            if (response.status === 401 && auth) {
                clearSession();
                // На самом колбэке ошибку покажет роутер — событие там лишнее.
                if (!window.location.pathname.startsWith("/oauth/callback")) {
                    window.dispatchEvent(new CustomEvent(AUTH_EVENT));
                }
            }

            throw error;
        }

        return data;
    } catch (err) {
        if (err?.name === "AbortError") {
            throw new ApiError("Сервер не ответил вовремя", { status: 0 });
        }
        if (err instanceof TypeError) {
            throw new ApiError("Не удалось связаться с сервером", { status: 0 });
        }
        throw err;
    } finally {
        clearTimeout(timer);
    }
}

export async function startProviderAuth(provider) {
    if (provider !== "google" && provider !== "github") {
        throw new Error(`Unknown provider: ${provider}`);
    }
    window.location.assign(`${OAUTH_BASE_URL}/oauth2/authorization/${provider}`);
}

export { API_BASE_URL };
