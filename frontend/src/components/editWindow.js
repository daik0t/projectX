import { getMetadata } from "../services/video-storage";
import { tagsListRender } from "./tagsList";
import { escapeHtml } from "../lib/html";

export async function renderEditWindow(token, id) {
    const data = getMetadata(id) ?? {};

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
                <div class="title-video" id="title-video">
                    ${escapeHtml(data.title ?? "Без названия")}
                </div>
                <div class="url-video" id="url-video">
                    ${escapeHtml(data.url ?? "—")}
                </div>
                <div class="place-tags-edit">
                    ${await tagsListRender(token, data, 1)}
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
