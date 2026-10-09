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
                    placeholder="_Название"
                    value="${link}"
                    required
                >

                <select class="tags-select" id="edit-tags-select">
                    <option value="">Тэги</option>
                    ${allTags.map(t => `
                        <option value="${t}" ${tags.includes(t) ? 'selected' : ''}>${t}</option>
                    `).join('')}
                </select>

                <div class="place-tags" id="edit-place-tags">
                    ${tags.map(t => `
                        <span class="tag-chip" data-tag="${t}">
                            ${t}
                            <button type="button" class="tag-chip-remove" aria-label="Удалить">×</button>
                        </span>
                    `).join('')}
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

export function initEditVideoWindow(openBtnId, overlayId, windowElId, formId) {
    const openBtn = document.getElementById(openBtnId);
    const overlay = document.getElementById(overlayId);
    const windowEl = document.getElementById(windowElId);
    const form = document.getElementById(formId);

    if (!overlay || !windowEl || !form || !openBtn) {
        return;
    }

    function open() {
        overlay.classList.add('show');
        windowEl.classList.add('show');
    }
    function close() {
        overlay.classList.remove('show');
        windowEl.classList.remove('show');
    }

    openBtn.addEventListener('click', open)

    
    overlay.addEventListener('click', close);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') close();
    });

    return { open, close };
}