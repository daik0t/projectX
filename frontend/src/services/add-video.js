import { createVideo } from "../api/video";
import { getContainer } from "./dom";
import { fetchVideoMetadata, parseVideoUrl, saveMetadata } from "./video-storage";
import { showToast } from "../lib/ui";
import { closeModal } from "../lib/modal";
import { updateVideoCard } from "../components/videoCard";

async function hydrateMetadata(video, url, tags) {
    try {
        const { meta } = await fetchVideoMetadata(url);
        if (meta) {
            saveMetadata(video.id, meta, url, tags);

            const card = document.querySelector(
                `.video-card[data-video-id="${String(video.id)}"]`
            );
            if (card) updateVideoCard(card, video);
        } else {
            console.warn(`[add-video] метаданные не получены для ${url}`);
        }
    } catch (err) {
        console.warn("[add-video] метаданные не получены:", err.message);
    }
}

export function setupAddVideo({ onSuccess } = {}) {
    const form = getContainer("add-window-form");
    const tagsList = getContainer("place-tags");

    if (!form || !tagsList) {
        console.warn("setupAddVideo: форма или список тегов не найдены");
        return;
    }

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const submitBtn = form.querySelector("#btn-apply");
        if (!submitBtn) return;

        const url = form.querySelector("#input-link").value.trim();

        if (!url) return;

        if (!parseVideoUrl(url)) {
            showToast("Не удалось распознать ссылку. Проверьте URL.", "error");
            return;
        }

        const selectedTags = [
            ...tagsList.querySelectorAll('input[name="tags"]:checked'),
        ].map((cb) => ({
            id: cb.value,
            name: cb.closest('.tag-item')?.querySelector('.tag-button')?.textContent?.trim() || cb.value,
        }));

        const originalText = submitBtn.textContent;
        submitBtn.textContent = "Добавление...";
        submitBtn.disabled = true;

        let created;
        try {
            created = await createVideo({
                url,
                tagIds: selectedTags.map((tag) => tag.id),
            });
            if (created?.id == null) {
                throw new Error("Сервер не вернул данные видео");
            }
        } catch (err) {
            console.error("[add-video] createVideo упал:", err);
            showToast("Ошибка при добавлении: " + err.message, "error");
            return;
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }

        form.reset();
        const addWindow = getContainer("add-window");
        if (addWindow) closeModal(addWindow);

        // Метаданные догружаем в фоне: окно уже закрыто, список обновляется отдельно.
        void hydrateMetadata(created, url, selectedTags);

        try {
            await onSuccess?.();
        } catch (err) {
            console.error("[add-video] список не обновился:", err);
            showToast("Видео добавлено, но список не удалось обновить", "error");
        }
    });
}
