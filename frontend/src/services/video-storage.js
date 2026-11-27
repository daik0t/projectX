import { getCurrentUserId } from "./session";
import { OEMBED_PROXY_URL } from "../lib/config";

const STORAGE_KEY = "yt_metadata";


function storageKey() {
    return `${STORAGE_KEY}:${getCurrentUserId() ?? "anon"}`;
}

function loadCache() {
    try {
        return JSON.parse(localStorage.getItem(storageKey())) || {};
    } catch {
        return {};
    }
}

function saveCache(cache) {
    try {
        localStorage.setItem(storageKey(), JSON.stringify(cache));
    } catch (e) {
        console.error("localStorage save failed", e);
    }
}

function normalizeTags(tags) {
    if (!Array.isArray(tags)) return [];

    return tags.map((tag) => {
        if (tag && typeof tag === "object") {
            return { id: tag.id, name: String(tag.name ?? "") };
        }
        return { id: tag, name: "" };
    });
}

function sameTags(left, right) {
    const a = normalizeTags(left);
    const b = normalizeTags(right);

    if (a.length !== b.length) return false;

    return a.every((tag, index) => (
        String(tag.id) === String(b[index].id) &&
        tag.name === b[index].name
    ));
}

export function saveMetadata(videoId, metadata, sourceUrl, tags) {
    const cache = loadCache();
    cache[videoId] = {
        ...metadata,
        id: videoId,
        url: sourceUrl,
        tags: normalizeTags(tags),
        savedAt: Date.now(),
    };
    saveCache(cache);
}

/**
 * Переносит актуальные теги из ответа API в локальный кэш метаданных.
 * Кэш нужен окнам редактирования/свойств, которые не получают video.tags напрямую.
 */
export function applyVideoTags(videos) {
    if (!Array.isArray(videos) || videos.length === 0) return;

    const cache = loadCache();
    let changed = false;

    videos.forEach((video) => {
        if (!video || video.id == null || !Array.isArray(video.tags)) return;

        const id = video.id;
        const tags = normalizeTags(video.tags);
        const current = cache[id] ?? { id };

        if (!Array.isArray(current.tags) || !sameTags(current.tags, tags)) {
            current.tags = tags;
            changed = true;
        }

        if (video.url && current.url !== video.url) {
            current.url = video.url;
            changed = true;
        }

        if (current.id == null) {
            current.id = id;
            changed = true;
        }

        if (!cache[id]) {
            cache[id] = current;
            changed = true;
        }
    });

    if (changed) saveCache(cache);
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
        Object.keys(localStorage)
            .filter((key) => key === STORAGE_KEY || key.startsWith(`${STORAGE_KEY}:`))
            .forEach((key) => localStorage.removeItem(key));
    } catch (e) {
        console.error("localStorage clear failed", e);
    }
}

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
    if (host === "vimeo.com" || host.endsWith(".vimeo.com")) {
        const m = u.pathname.match(/\/(\d+)/);
        if (m) return { platform: "vimeo", id: m[1], canonical: `https://vimeo.com/${m[1]}` };
    }
    if (/(^|\.)tiktok\.com$/.test(host) && /\/video\/\d+/.test(u.pathname)) {
        return { platform: "tiktok", id: u.pathname, canonical: u.toString() };
    }
    return { platform: "unknown", id: null, canonical: u.toString() };
}


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
    if (!OEMBED_PROXY_URL) return null;
    const params = new URLSearchParams({ url: parsed.canonical });
    return `${OEMBED_PROXY_URL}?${params.toString()}`;
}

export async function fetchVideoMetadata(rawUrl) {
    const parsed = parseVideoUrl(rawUrl);
    if (!parsed) {
        throw new Error("Не удалось распознать ссылку. Проверьте URL.");
    }

    const build = OEMBED_PROVIDERS[parsed.platform];
    const endpoint = build ? build(parsed) : buildProxyUrl(parsed);

    if (!endpoint) {
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

export async function ensureVideoMetadata(video) {
    const { id, url, tags = [] } = video;
    const currentTags = normalizeTags(tags);

    let cached = getMetadata(id);

    if (cached && !sameTags(cached.tags, currentTags)) {
        saveMetadata(id, cached, cached.url ?? url, currentTags);
        cached = { ...cached, tags: currentTags };
    }

    // Если в кэше уже есть полноценные метаданные, oEmbed повторно не нужен.
    if (cached?.title) return cached;

    let result;
    try {
        result = await fetchVideoMetadata(url);
    } catch (err) {
        console.warn(`[video-storage] некорректная ссылка ${url}:`, err.message);
        return cached;
    }

    if (!result.meta) {
        if (result.reason !== "unsupported") {
            console.warn(`[video-storage] метаданные недоступны для ${url}: ${result.reason}`);
        }
        return cached;
    }

    saveMetadata(id, result.meta, url, currentTags);
    return result.meta;
}

export async function ensureVideosMetadata(videos, { concurrency = 4, onEach } = {}) {
    if (!Array.isArray(videos) || videos.length === 0) return;
    const queue = videos.slice();
    const worker = async () => {
        while (queue.length) {
            const video = queue.shift();
            const meta = await ensureVideoMetadata(video);
            if (meta) onEach?.(video, meta);
        }
    };
    const workers = Array.from(
        { length: Math.min(concurrency, queue.length) },
        () => worker()
    );
    await Promise.all(workers);
}
