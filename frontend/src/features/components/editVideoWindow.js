import { dropdownRender } from "./dropdown";

export function editVideoRender(video = {}) {
    const {
        link = '',
        title = '',
        tags = [],
    } = video;

    const allTags = ['Тег 1', 'Тег 2', 'Тег 3', 'Тег 4'];

    return `
        <div id="edit-video-overlay" class="add-video-overlay"></div>

        <div class="add-video-window" id="edit-video-window">
            <form class="add-video-form" id="edit-video-form" novalidate>

                <label class="form-label" for="edit-input-link">Ссылка</label>
                <input
                    id="edit-input-link"
                    type="text"
                    name="input-link"
                    placeholder="название"
                    value="${link}"
                    required
                >


                <div class="place-tags" id="edit-place-tags">
                     ${dropdownRender({asList: true})}
                </div>

                <div class="edit-actions">
                    <button type="button" class="edit-delete" id="edit-delete">
                        Удалить
                    </button>
                    <button type="submit" class="edit-save">
                        Сохранить
                    </button>
                </div>

            </form>
        </div>
    `;
}
