import { getMetadata } from "../services/video-storage";
import { escapeHtml } from "../lib/html";

function formatTags(tags) {
    if (!Array.isArray(tags)) return "—";

    const names = tags
        .map((tag) => (tag && typeof tag === "object" ? tag.name : null))
        .filter(Boolean);

    return names.length ? names.join(", ") : "—";
}

export async function renderPropertiesWindow(id) {
    const data = getMetadata(id) ?? {};

    const title = escapeHtml(data.title ?? "Без названия");
    const thumbnail = data.thumbnail_url ? escapeHtml(data.thumbnail_url) : "";
    const author = escapeHtml(data.author_name ?? "—");
    const provider = escapeHtml(data.provider_name ?? "—");
    const url = escapeHtml(data.url ?? "—");
    const tags = escapeHtml(formatTags(data.tags));

    return `
    <div class="properties-window-overlay" id="properties-window-overlay" aria-hidden="true"></div>
    <div class="properties-window" id="properties-window" role="dialog" aria-modal="true" aria-labelledby="properties-window-title" aria-hidden="true">
        <div class="title-add-window">
            <div class="title-text" id="properties-window-title">Свойства</div>
            <button class="btn-close" id="btn-close-properties" type="button" aria-label="Закрыть">
                <img src="/assets/cross.svg" alt="">
            </button>
        </div>
        ${thumbnail ? `<img src="${thumbnail}" class="img-properties" alt="${title}">` : ""}
        <div class="title-video" id="title-video">
            Название: ${title}
        </div>
        <div class="video-author" id="video-author">
            Автор: ${author}
        </div>
        <div class="video-provaider" id="video-provaider">
            Откуда: ${provider}
        </div>
        <div class="place-tags-properties" id="place-tags-properties">
            Тэги: ${tags}
        </div>
        <div class="link-properties" id="link-properties">
            Ссылка: ${data.url
                ? `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`
                : "—"}
        </div>
    </div>
    `;
}
