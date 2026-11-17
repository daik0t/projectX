import { createVideo } from "../api/video";
import { getContainer } from "./dom";
import { fetchVideoMetadata, parseVideoUrl, saveMetadata } from "./video-storage";
import { showToast } from "../lib/ui";

export async function setupAddVideo({ token, onSuccess }) {
    const form = getContainer("add-window-form");
    const tagsList = getContainer("place-tags");

    if (!form || !tagsList) {
        console.warn("setupAddVideo: форма или список тегов не найдены");
        return;
    }

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const submitBtn = form.querySelector("#btn-apply");
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

        try {
            const created = await createVideo(token, {
                url,
                tagIds: selectedTags.map((tag) => tag.id),
            });

            if (created?.id != null) {
                try {
                    const { meta } = await fetchVideoMetadata(url);
                    if (meta) {
                        saveMetadata(created.id, meta, url, selectedTags);
                    } else {
                        console.warn(`[add-video] метаданные не получены для ${url}`);
                    }
                } catch (err) {
                    console.warn("[add-video] метаданные не получены:", err.message);
                }
            }

            form.reset();
            if (onSuccess) await onSuccess();
            getContainer("add-window")?.classList.remove("show");
            getContainer("add-window-overlay")?.classList.remove("show");
        } catch (err) {
            console.error("[add-video] createVideo упал:", err);
            showToast("Ошибка при добавлении: " + err.message, "error");
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });
}
