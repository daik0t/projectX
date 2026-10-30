import { initModal } from "../utils/modal";
import { dropdownRender, initList } from "./dropdown";
import { updateVideoTags } from "../api/video";

export function editVideoRender(allTags = []) {
    return `
        <div id="edit-video-overlay" class="add-video-overlay"></div>

        <div class="add-video-window" id="edit-video-window">
            <form class="add-video-form" id="edit-video-form" novalidate>

                <label class="form-label" for="edit-input-link">Ссылка (нельзя изменить)</label>
                <!-- Делаем readonly, так как API не поддерживает изменение url -->
                <input
                    id="edit-input-link"
                    type="text"
                    name="input-link"
                    placeholder="Ссылка"
                    readonly
                    style="background-color: #eee; cursor: not-allowed;"
                >

                <div class="place-tags" id="edit-place-tags">
                     ${dropdownRender({ asList: true, tags: allTags })}
                </div>

                <div class="edit-actions">
                    <button type="button" class="edit-delete" id="edit-delete">Удалить</button>
                    <button type="submit" class="edit-save">Сохранить</button>
                </div>

            </form>
        </div>
    `;
}

export function setupEditVideo({ token, onSuccess, onDeleteSuccess }) {
    const editModal = initModal({ 
        openBtnId: null, 
        overlayId: 'edit-video-overlay', 
        windowId: 'edit-video-window',
    });

    const tagsDropdown = initList('edit-input-link', {
        onCreateTag: (name) => createTag(token, { name })
    });

    const form = document.getElementById('edit-video-form');
    const deleteBtn = document.getElementById('edit-delete');
    
    let currentVideoId = null;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentVideoId) return;

        const submitBtn = form.querySelector('.edit-save');
        const tagIds = tagsDropdown ? tagsDropdown.getSelected() : [];

        submitBtn.disabled = true;
        submitBtn.textContent = 'Сохранение...';

        try {
            await updateVideoTags(token, currentVideoId, tagIds);
            editModal.close();
            if (onSuccess) onSuccess();
        } catch (err) {
            alert('Ошибка при сохранении: ' + err.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Сохранить';
        }
    });

    deleteBtn.addEventListener('click', async () => {
        if (!currentVideoId) return;
        if (!confirm('Вы уверены, что хотите удалить это видео?')) return;

        try {
            deleteBtn.disabled = true;
            await deleteVideo(token, currentVideoId);
            editModal.close();
            if (onDeleteSuccess) onDeleteSuccess();
        } catch (err) {
            alert('Ошибка удаления: ' + err.message);
            deleteBtn.disabled = false;
        }
    });

    return {
        open(video) {
            currentVideoId = video.id;
            form.querySelector('#edit-input-link').value = video.url || '';
            
            tagsDropdown?.reset();
            tagsDropdown?.setSelected(video.tagIds || []);
            
            editModal.open();
        },
        close: editModal.close
    };
}