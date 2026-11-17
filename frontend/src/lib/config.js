// Единая точка настройки API-ссылок.
// Значения берутся из .env / .env.local (Vite прокидывает VITE_* в import.meta.env).
// Пустой API_BASE_URL означает «тот же origin»: в dev это прокси Vite,
// в проде — reverse-proxy, отдающий /api на бэкенд.

function normalizeBaseUrl(value) {
    if (typeof value !== "string") return "";
    return value.trim().replace(/\/+$/, "");
}

/** REST API, например http://localhost:8080 или https://api.example.com */
export const API_BASE_URL = normalizeBaseUrl(import.meta.env.VITE_API_URL);

/** OAuth-эндпоинты (/oauth2/authorization/...); по умолчанию совпадает с API. */
export const OAUTH_BASE_URL = normalizeBaseUrl(import.meta.env.VITE_OAUTH_URL) || API_BASE_URL;

/** Серверный oEmbed-прокси для платформ без прямого oEmbed. */
export const OEMBED_PROXY_URL = normalizeBaseUrl(import.meta.env.VITE_OEMBED_PROXY);
