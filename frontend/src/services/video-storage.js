const STORAGE_KEY = "yt_metadata";

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

/**
 * Строгая проверка + загрузка метаданных.
 * БРОСАЕТ Error с человекочитаемым сообщением при любой проблеме.
 * Используется в add-video.js — если упало, видео не создаётся.
 * @returns {Promise<{ meta: object, parsed: object }>}
 */
export async function fetchVideoMetadata(rawUrl) {
    const parsed = parseVideoUrl(rawUrl);
    if (!parsed) {
        throw new Error("Не удалось распознать ссылку. Проверьте URL.");
    }

    const build = OEMBED_PROVIDERS[parsed.platform];

    // Известный провайдер — прямой запрос из браузера
    if (build) {
        let res;
        try {
            res = await fetchWithTimeout(build(parsed));
        } catch (e) {
            if (e.name === "AbortError") {
                throw new Error(`Не удалось связаться с ${parsed.platform}: превышено время ожидания`);
            }
            throw new Error(`Не удалось связаться с ${parsed.platform}: ${e.message}`);
        }
        if (!res.ok) {
            throw new Error(`Видео недоступно на ${parsed.platform} (HTTP ${res.status})`);
        }
        let meta;
        try {
            meta = await res.json();
        } catch {
            throw new Error(`${parsed.platform} вернул некорректный ответ`);
        }
        return { meta, parsed };
    }

    // Неизвестная платформа — discovery через бэк
    let res;
    try {
        const params = new URLSearchParams({ url: parsed.canonical });
        res = await fetchWithTimeout(`/api/oembed?${params}`, { timeoutMs: 8000 });
    } catch (e) {
        if (e.name === "AbortError") {
            throw new Error("Сервер проверки ссылок не ответил вовремя");
        }
        throw new Error(`Не удалось проверить ссылку: ${e.message}`);
    }

    if (!res.ok) {
        throw new Error(`Платформа не поддерживается (HTTP ${res.status})`);
    }

    let meta;
    try {
        meta = await res.json();
    } catch {
        throw new Error("Сервер вернул некорректный ответ");
    }
    return { meta, parsed };
}

// ---------- ensure (мягкий, для рендера) ----------

/**
 * Мягкая версия: никогда не бросает.
 * Если метаданных нет и fetchVideoMetadata упал — возвращает null,
 * карточка отрендерится с заглушкой, список не сломается.
 */
export async function ensureVideoMetadata(video) {
    const { id, url, tags = [] } = video;

    const cached = getMetadata(id);
    if (cached) return cached;

    try {
        const { meta } = await fetchVideoMetadata(url);
        saveMetadata(id, meta, url, tags);
        return meta;
    } catch (err) {
        console.warn(`[video-storage] oEmbed упал для ${url}:`, err.message);
        return null;
    }
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