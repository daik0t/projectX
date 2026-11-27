import { tagsListRender } from "./tagsList";
import { setupAddVideo } from "../services/add-video";

export async function renderAddWindow(tags = null) {

    const tagsHtml = await tagsListRender({}, 1, tags)

    return `
        <div class="add-window-overlay" id="add-window-overlay" aria-hidden="true"></div>
        <div class="add-window" id="add-window" role="dialog" aria-modal="true" aria-labelledby="add-window-title" aria-hidden="true">
            <form class="add-window-form" id="add-window-form">
                <div class="title-add-window">
                    <div class="title-text" id="add-window-title">Окно добавления</div>
                    <button class="btn-close" id="btn-close" type="button" aria-label="Закрыть">
                        <img src="/assets/cross.svg" alt="">
                    </button>
                </div>
                <div class="body-add-window">
                    <input type="text" inputmode="url" class="input-link" id="input-link" name="url"
                        placeholder="Ссылка на видео (обязательно)" aria-label="Ссылка на видео"
                        required data-autofocus>
                    <div class="place-tags" id="place-tags">
                        ${tagsHtml}
                    </div>
                </div>
                <div class="footer-add-window">
                    <button class="btn-apply" id="btn-apply" type="submit">Добавить</button>
                    <button class="btn-cancel" id="btn-cancel" type="button">Отмена</button>
                </div>
            </form>
        </div>
        `
}
