import { getMetadata } from "../services/video-storage"

export async function renderPropertiesWindow(id) {
    
    const data = getMetadata(id)

    return`
    <div class="properties-window-overlay" id="properties-window-overlay"></div>
    <div class="properties-window" id="properties-window">
        <div class="title-add-window">
            <div class="title-text">Свойства</div>
            <button class="btn-close" id="btn-close-properties" type="button">
                <img src="./src/assets/cross.svg">
            </button>
        </div>
        ${data.thumbnail_url
                    ? `<img src="${data.thumbnail_url}" class="img-properties" alt="${data.title}">`
                    : `<img>`}
        <div class="title-video" id="title-video">
            Название: ${data.title}
        </div>
        <div class="video-author" id="video-author">
            Автор: ${data.author_name}
        </div>
        <div class="video-provaider" id="video-provaider">
            Откуда: ${data.provaider_name}
        </div>
        <div class="place-tags-properties" id="place-tags-properties">
            Тэги: ${data.tags}
        </div>
        <div class="link-properties" id="link-properties">
            Ссылка: ${data.url}
        </div>
    </div>
    `
}