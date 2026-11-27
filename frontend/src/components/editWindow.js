import { getMetadata } from "../services/video-storage";
import { tagsListRender } from "./tagsList";
import { escapeHtml } from "../lib/html";
import { safeHttpUrl } from "../lib/url";

export async function renderEditWindow(id) {
    const data = getMetadata(id) ?? {};

    const title = escapeHtml(data.title ?? "Без названия");
    const url = safeHttpUrl(data.url);
    const urlText = escapeHtml(data.url ?? "—");
  

    return `
    <div class="edit-window-overlay" id="edit-window-overlay" aria-hidden="true"></div>
    <div class="edit-window" id="edit-window" role="dialog" aria-modal="true" aria-labelledby="edit-window-title" aria-hidden="true">
        <form class="edit-window-form" id="edit-window-form">
            <div class="title-edit-window">
                <div class="title-text-edit" id="edit-window-title">Окно редактирования</div>
                <button class="btn-close-edit" id="btn-close-edit" type="button" aria-label="Закрыть">
                    <img src="/assets/cross.svg" alt="">
                </button>
            </div>
            <div class="body-edit-window">
                <div class="title-video-edit" id="title-video">
                    <b>Название:</b> ${title}
                </div>
                <div class="url-video" id="url-video">
                    <b>Ссылка:</b> ${url
                ? `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${urlText}</a>`
                : "—"}
                </div>
                <div class="place-tags-edit">
                    ${await tagsListRender(data, 1)}
                </div>
            </div>
            <div class="footer-edit-window">
                <button class="btn-apply-edit" id="btn-apply-edit" type="submit">Редактировать</button>
                <button class="btn-cancel" id="btn-cancel-edit" type="button">Отмена</button>
            </div>
        </form>
    </div>  
    `;
}
