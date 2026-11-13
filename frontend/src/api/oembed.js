async function fetchOembedDirect(parsed) {
    const build = OEMBED_PROVIDERS[parsed.platform];

    if (build) {
        const res = await fetchWithTimeout(build(parsed));
        if (!res.ok) throw new Error(`oEmbed ${parsed.platform} → HTTP ${res.status}`);
        return res.json();
    }

    // неизвестная платформа — пробуем discovery через бэк
    try {
        const params = new URLSearchParams({ url: parsed.canonical });
        const res = await fetchWithTimeout(`/api/oembed?${params}`, { timeoutMs: 8000 });
        if (!res.ok) return null;
        return res.json();
    } catch {
        return null;
    }
}