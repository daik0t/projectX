const STORAGE_KEY = "yt_metadata";

// Необязательный серверный прокси для oEmbed (YouTube/Vimeo/TikTok запрашиваются
// из браузера напрямую). Пример: VITE_OEMBED_PROXY=http://localhost:8080/api/oembed
const OEMBED_PROXY = import.meta.env.VITE_OEMBED_PROXY ?? "";

// ---------- storage ----------

function loadCache() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch {
        return {};
    }
}

function saveCache(cache) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
    } catch (e) {
        console.error("localStorage save failed", e);
    }
}

export function saveMetadata(videoId, metadata, sourceUrl, tags) {
    const cache = loadCache();
    cache[videoId] = {
        ...metadata,
        id: videoId,
        url: sourceUrl,
        tags,
        savedAt: Date.now(),
    };
    saveCache(cache);
}

export function getMetadata(videoId) {
    return loadCache()[videoId] || null;
}

export function removeMetadata(videoId) {
    const cache = loadCache();
    if (!(videoId in cache)) return false;
    delete cache[videoId];
    saveCache(cache);
    return true;
}

export async function clearAllMetadata() {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
        console.error("localStorage clear failed", e);
    }
}

// ---------- URL parsing ----------

export function parseVideoUrl(rawUrl) {
    if (typeof rawUrl !== "string" || rawUrl.trim() === "") return null;

    let u;
    try {
        u = new URL(/^https?:\/\//.test(rawUrl) ? rawUrl : `https://${rawUrl}`);
    } catch {
        return null;
    }

    const host = u.hostname.replace(/^www\./, "");
    const YT_HOSTS = new Set([
        "youtube.com", "m.youtube.com", "music.youtube.com", "youtube-nocookie.com",
    ]);
    const YT_ID_RE = /^[\w-]{11}$/;

    if (YT_HOSTS.has(host)) {
        let id = null;
        if (u.pathname === "/watch") id = u.searchParams.get("v");
        else {
            const m = u.pathname.match(/^\/(?:shorts|embed|v|live)\/([\w-]{11})/);
            if (m) id = m[1];
        }
        if (id && YT_ID_RE.test(id)) {
            return { platform: "youtube", id, canonical: `https://www.youtube.com/watch?v=${id}` };
        }
    }
    if (host === "youtu.be") {
        const id = u.pathname.split("/")[1];
        if (YT_ID_RE.test(id)) {
            return { platform: "youtube", id, canonical: `https://www.youtube.com/watch?v=${id}` };
        }
    }
    if (host.endsWith("vimeo.com")) {
        const m = u.pathname.match(/\/(\d+)/);
        if (m) return { platform: "vimeo", id: m[1], canonical: `https://vimeo.com/${m[1]}` };
    }
    if (/(^|\.)tiktok\.com$/.test(host) && /\/video\/\d+/.test(u.pathname)) {
        return { platform: "tiktok", id: u.pathname, canonical: u.toString() };
    }
    return { platform: "unknown", id: null, canonical: u.toString() };
}

// ---------- oEmbed (frontend-only) ----------

async function fetchWithTimeout(url, { timeoutMs = 8000 } = {}) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        return await fetch(url, { signal: ctrl.signal, redirect: "follow" });
    } finally {
        clearTimeout(t);
    }
}

const OEMBED_PROVIDERS = {
    youtube: (p) =>
        `https://www.youtube.com/oembed?url=${encodeURIComponent(p.canonical)}&format=json`,
    vimeo: (p) =>
        `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(p.canonical)}`,
    tiktok: (p) =>
        `https://www.tiktok.com/oembed?url=${encodeURIComponent(p.canonical)}`,
};

function buildProxyUrl(parsed) {
    if (!OEMBED_PROXY) return null;
    const params = new URLSearchParams({ url: parsed.canonical });
    return `${OEMBED_PROXY}?${params.toString()}`;
}

/**
 * Пытается получить метаданные видео.
 * Из-за сети/провайдера НЕ бросает: возвращает { meta: null, parsed, reason },
 * чтобы добавление видео не зависело от доступности oEmbed.
 * Бросает только при синтаксически некорректной ссылке.
 * @returns {Promise<{ meta: object|null, parsed: object, reason?: string }>}
 */
export async function fetchVideoMetadata(rawUrl) {
    const parsed = parseVideoUrl(rawUrl);
    if (!parsed) {
        throw new Error("Не удалось распознать ссылку. Проверьте URL.");
    }

    const build = OEMBED_PROVIDERS[parsed.platform];
    const endpoint = build ? build(parsed) : buildProxyUrl(parsed);

    if (!endpoint) {
        // Платформа без прямого oEmbed и без настроенного прокси.
        return { meta: null, parsed, reason: "unsupported" };
    }

    try {
        const res = await fetchWithTimeout(endpoint);
        if (!res.ok) {
            return { meta: null, parsed, reason: `HTTP ${res.status}` };
        }
        const meta = await res.json();
        return { meta, parsed };
    } catch (err) {
        return {
            meta: null,
            parsed,
            reason: err?.name === "AbortError" ? "timeout" : String(err?.message ?? err),
        };
    }
}

// ---------- ensure (мягкий, для рендера) ----------

/**
 * Мягкая версия: никогда не бросает.
 * Если метаданных нет — карточка рендерится с заглушкой, список не ломается.
 */
export async function ensureVideoMetadata(video) {
    const { id, url, tags = [] } = video;

    const cached = getMetadata(id);
    if (cached) return cached;

    let result;
    try {
        result = await fetchVideoMetadata(url);
    } catch (err) {
        console.warn(`[video-storage] некорректная ссылка ${url}:`, err.message);
        return null;
    }

    if (!result.meta) {
        console.warn(`[video-storage] метаданные недоступны для ${url}: ${result.reason}`);
        return null;
    }

    saveMetadata(id, result.meta, url, tags);
    return result.meta;
}

export async function ensureVideosMetadata(videos, { concurrency = 4 } = {}) {
    if (!Array.isArray(videos) || videos.length === 0) return;
    const queue = videos.slice();
    const worker = async () => {
        while (queue.length) {
            await ensureVideoMetadata(queue.shift());
        }
    };
    const workers = Array.from(
        { length: Math.min(concurrency, queue.length) },
        () => worker()
    );
    await Promise.all(workers);
}
