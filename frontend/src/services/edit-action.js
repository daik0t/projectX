import { getContainer } from "./dom";
import { updateVideoTags } from "../api/video";
import { saveMetadata, getMetadata } from "./video-storage";

export async function editVideo(token, currentVideoId){
    const  form = getContainer("edit-window-form")
 
    form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const btn = form.querySelector('#btn-apply-edit');
            const tagsRoot = form.querySelector('.place-tags-edit');

            const selectedTags = [
                ...tagsRoot.querySelectorAll('input[name="tags"]:checked'),
            ].map(cb => cb.value);

            const originalText = btn.textContent;
            btn.textContent = 'Сохранение...';
            btn.disabled = true;

            try {
                await updateVideoTags(token, currentVideoId, selectedTags);

                const existing = getMetadata(currentVideoId);
                if (existing) {
                    saveMetadata(
                        currentVideoId,
                        existing,
                        existing.url,
                        selectedTags,
                    );
                }

                getContainer('edit-window')?.classList.remove('show');
                getContainer('edit-window-overlay')?.classList.remove('show');
                        } catch (err) {
                console.error(err);
                alert('Ошибка при сохранении: ' + err.message);
            } finally {
                btn.textContent = originalText;
                btn.disabled = false;
            }
});
}