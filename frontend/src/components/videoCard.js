import { getMetadata } from "../services/video-storage";
import { escapeHtml } from "../lib/html";

export async function videoCardRender(video) {
    const meta = getMetadata(video.id) ?? {};
    const title = escapeHtml(meta.title ?? 'Без названия');
    const thumbnail = meta.thumbnail_url ? escapeHtml(meta.thumbnail_url) : '';

    return `
        <div class="video-card" data-video-id="${video.id}">
            <div class="card-preview">
                ${thumbnail ? `<img src="${thumbnail}" alt="${title}" loading="lazy">` : ""}
            </div>
            <div class="card-title">
                ${title}
            </div>
        </div>
    `;
}
