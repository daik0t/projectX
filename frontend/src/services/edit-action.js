import { getContainer } from "./dom";
import { updateVideoTags } from "../api/video";
import { saveMetadata, getMetadata } from "./video-storage";
import { showToast } from "../lib/ui";
import { renderVideoList } from "./render-video-list";
import { getFilterState } from "./filter";
import { closeModal } from "../lib/modal";

export async function editVideo(currentVideoId) {
    const form = getContainer("edit-window-form");
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const btn = form.querySelector('#btn-apply-edit');
        const tagsRoot = form.querySelector('.place-tags-edit');
        if (!btn || !tagsRoot) return;

        const selectedTags = [
            ...tagsRoot.querySelectorAll('input[name="tags"]:checked'),
        ].map(cb => ({
            id: cb.value,
            name: cb.closest('.tag-item')?.querySelector('.tag-button')?.textContent?.trim() || cb.value,
        }));

        const originalText = btn.textContent;
        btn.textContent = 'Сохранение...';
        btn.disabled = true;

        try {
            await updateVideoTags(currentVideoId, selectedTags.map(tag => tag.id));

            const existing = getMetadata(currentVideoId);
            if (existing) {
                saveMetadata(
                    currentVideoId,
                    existing,
                    existing.url,
                    selectedTags,
                );
            }

            const editWindow = getContainer('edit-window');
            if (editWindow) closeModal(editWindow);

            const grid = getContainer('video-grid');
            if (grid) await renderVideoList(grid, getFilterState());
        } catch (err) {
            console.error(err);
            showToast('Ошибка при сохранении: ' + err.message, 'error');
        } finally {
            btn.textContent = originalText;
            btn.disabled = false;
        }
    });
}
