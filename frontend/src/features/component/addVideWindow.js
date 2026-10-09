import "../style/widgets/addvideo.css"

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
                <input id="tags-select" name="tags-select" readonly placeholder="тэги">
                <div id="dropdown-select" class="dropdown">
                    <button class="dropdown-item" type="button">Тэг</button> <!-- Функция по определению всех тэгов -->
                </div>

                <div class="place-tags"></div>
                <button type="submit" class="add-video-submit">Добавить</button>
            </form>
        </div>
    `;
}

export function insertAddVideoWindow (overlayId, btnId, windowId) {

    const overlay = document.getElementById(overlayId);
    const window = document.getElementById(windowId)
    const btn = document.getElementById(btnId)

    if (!overlay || !window || !btn) {
        return;
    }

    function openAddVideoWindow() {
        overlay.classList.add('show');
        window.classList.add('show');
    }

    function closeAddVideoWindow() {
        overlay.classList.remove('show');
        window.classList.remove('show');
    }

    btn.addEventListener('click', openAddVideoWindow)

    overlay.addEventListener('click', closeAddVideoWindow);


    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeAddVideoWindow();
    });
}