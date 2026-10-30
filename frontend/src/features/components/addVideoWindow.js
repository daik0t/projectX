import { dropdownRender, initList } from "./dropdown";
import { createVideo, getTags, createTag } from "../api/video";
import { initModal } from "../utils/modal";


export async function addVideoRender(token) {
    let tags = [];
    try {
        tags = await getTags(token);
    } catch (e) {
        console.error("Не удалось загрузить теги", e);
    }

    return `
        <div id="add-video-overlay" class="add-video-overlay"></div>

        <div class="add-video-window" id="add-video-window">
            <form class="add-video-form" id="add-video-form">
                <input
                    id="input-link"
                    type="text"
                    name="url"
                    placeholder="Ссылка на видео (обязательно)"
                    required
                >
                <button type="button" class="download-video">+ Загрузить видео файлом</button>
                
                <input
                    id="input-name"
                    type="text"
                    name="title"
                    placeholder="Название (не поддерживается)"
                    disabled
                >
                
                <div class="place-tags" id="place-tags">
                    ${dropdownRender({ asList: true, tags: tags })}
                </div>
                
                <button type="submit" class="add-video-submit">Добавить</button>
            </form>
        </div>
    `;
}


export async function setupAddVideo({ token, openBtnId, onSuccess }) {

    if (!document.getElementById('add-video-window')) {
        const html = await addVideoRender(token);
        document.body.insertAdjacentHTML('beforeend', html);
    }


    const modal = initModal({
        openBtnId: openBtnId,          
        overlayId: 'add-video-overlay',
        windowId: 'add-video-window',
        onOpen: () => {
            const form = document.getElementById('add-video-form');
            if (form) form.reset();

        }
    });

    if (!modal) return;

    const form = document.getElementById('add-video-form');
    if (!form) return;

    const tagsDropdown = initList('input-link', {
        onCreateTag: (name) => createTag(token, { name }),
    });
    

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = form.querySelector('.add-video-submit');
        const url = form.querySelector('#input-link').value.trim();

        const selectedTags = tagsDropdown ? tagsDropdown.getSelected() : [];

        if (!url) return;

        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Загрузка...';
        submitBtn.disabled = true;

        try {
            await createVideo(token, { 
                url: url, 
                tagIds: selectedTags 
            });

            modal.close();
            if (onSuccess) onSuccess();
            
        } catch (err) {
            console.error(err);
            alert('Ошибка при добавлении: ' + err.message);
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });

    return modal;
}