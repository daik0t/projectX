import { getMetadata } from "../services/video-storage";
import { tagsListRender } from "./tagsList";

export async function renderEditWindow (token, id){

    const data = getMetadata(id)
    
    if (!data){
        return `<div class="error">Видео не найдено</div>`;
    }

    return `
    <div class="edit-window-overlay" id="edit-window-overlay"></div>
    <div class="edit-window" id="edit-window">
        <form class="edit-window-form" id="edit-window-form">
            <div class="title-edit-window">
                <div class="title-text-edit">Окно редактирования</div>
                <button class="btn-close-edit" id="btn-close-edit" type="button">
                    <img src="./src/assets/cross.svg">
                </button>
            </div>
            <div class="body-edit-window">
                <div class="title-video" id="title-video">
                    ${data.title}
                </div>
                <div class="url-video" id="url-video">
                    ${data.url}
                </div>
                <div class="place-tags-edit">
                    ${await tagsListRender(token, data, 1   )}
                </div>
            </div>
            <div class="footer-edit-window">
                <button class="btn-apply-edit" id="btn-apply-edit" type="submit">Редактировать</button>
                <button class="btn-cancel" id="btn-cancel-edit" type="button">Отмена</button>
            </div>
        </form>
    </div>  
    `
}