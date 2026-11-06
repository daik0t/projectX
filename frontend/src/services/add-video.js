import { createVideo } from "../api/video";
import { getContainer } from "./dom";

export async function setupAddVideo({ token, onSuccess }) {
    const form = getContainer("add-window-form");
    const tagsList = getContainer("place-tags");

    if (!form || !tagsList) {
        console.warn('setupAddVideo: форма или список тегов не найдены');
        return;
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = form.querySelector('#btn-apply');
        const url = form.querySelector('#input-link').value.trim();

        const selectedTags = [
            ...tagsList.querySelectorAll('input[name="tags"]:checked')
        ].map(cb => cb.value);

        if (!url) return;

        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Загрузка...';
        submitBtn.disabled = true;

        try {
            await createVideo(token, { url, tagIds: selectedTags });
            form.reset();
            if (onSuccess) await onSuccess();
            getContainer('add-window')?.classList.remove('show');
            getContainer('add-window-overlay')?.classList.remove('show');
        } catch (err) {
            console.error(err);
            alert('Ошибка при добавлении: ' + err.message);
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });
}