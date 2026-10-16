import { dropdownRender } from "./dropdown";

export function addVideoRender() {
    return `
        <div id="add-video-overlay" class="add-video-overlay"></div>

        <div class="add-video-window" id="add-video-window">
            <form class="add-video-form" id="add-video-form">
                <input
                    id="input-link"
                    type="text"
                    name="input-link"
                    placeholder="ссылка"
                    required
                >
                <button type="button" class="download-video">+ Загрузить видео файлом</button>
                <input
                    id="input-name"
                    type="text"
                    name="input-name"
                    placeholder="название (необязательно)"
                >
                
                <div class="place-tags" id = "place-tags">
                ${dropdownRender({ asList: true })}
                </div>
                <button type="submit" class="add-video-submit">Добавить</button>
            </form>
        </div>
    `;
}
