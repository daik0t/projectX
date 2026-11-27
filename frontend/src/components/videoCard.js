import { getMetadata } from "../services/video-storage";
import { escapeHtml } from "../lib/html";
import { safeHttpUrl } from "../lib/url";

export function videoCardRender(video) {
    const meta = getMetadata(video.id) ?? {};
    const title = escapeHtml(meta.title ?? 'Без названия');
    const thumbnail = safeHttpUrl(meta.thumbnail_url) ?? '';

    return `
        <div class="video-card" data-video-id="${escapeHtml(video.id)}" data-title="${title}"
            tabindex="0" role="button" aria-label="${title}" aria-haspopup="menu" draggable="true">
            <div class="card-preview">
                ${thumbnail ? `<img src="${thumbnail}" alt="${title}" loading="lazy" draggable="false">` : ""}
            </div>
            <div class="card-title">
                ${title}
            </div>
        </div>
    `;
}

export function updateVideoCard(card, video) {
    if (!card) return;

    const meta = getMetadata(video.id) ?? {};
    const title = meta.title ?? 'Без названия';

    card.dataset.title = title;
    card.setAttribute('aria-label', title);

    const titleEl = card.querySelector('.card-title');
    if (titleEl) titleEl.textContent = title;

    const preview = card.querySelector('.card-preview');
    const thumbnail = safeHttpUrl(meta.thumbnail_url);
    if (preview && thumbnail) {
        let img = preview.querySelector('img');
        if (!img) {
            img = document.createElement('img');
            img.loading = 'lazy';
            img.draggable = false;
            preview.replaceChildren(img);
        }
        img.alt = title;
        if (img.getAttribute('src') !== thumbnail) {
            img.src = thumbnail;
        }
    }
}
