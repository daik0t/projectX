import { tagsListRender } from "./tagsList";
import { setupAddVideo } from "../services/add-video";

    export async function renderAddWindow(token){

        let tagsHtml = await tagsListRender(token, {}, 1)

        return `
        <div class="add-window-overlay" id="add-window-overlay"></div>
        <div class="add-window" id="add-window">
            <form class="add-window-form" id="add-window-form">
                <div class="title-add-window">
                    <div class="title-text">Окно добавления</div>
                    <button class="btn-close" id="btn-close" type="button">
                        <img src="./src/assets/cross.svg">
                    </button>
                </div>
                <div class="body-add-window">
                    <input type="url" class="input-link" id="input-link" name="url" placeholder="Ссылка на видео(обязательно)" required>
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