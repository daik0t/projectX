
function normalizeBaseUrl(value) {
    if (typeof value !== "string") return "";
    return value.trim().replace(/\/+$/, "");
}

export const API_BASE_URL = normalizeBaseUrl(import.meta.env.VITE_API_URL);

export const OAUTH_BASE_URL = normalizeBaseUrl(import.meta.env.VITE_OAUTH_URL) || API_BASE_URL;

export const OEMBED_PROXY_URL = normalizeBaseUrl(import.meta.env.VITE_OEMBED_PROXY);
