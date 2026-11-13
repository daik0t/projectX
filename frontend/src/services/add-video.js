import { createVideo } from "../api/video";
import { getContainer } from "./dom";
import { fetchVideoMetadata, saveMetadata } from "./video-storage";

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

        const selectedTags = [
            ...tagsList.querySelectorAll('input[name="tags"]:checked'),
        ].map((cb) => cb.value);

        if (!url) return;

        const originalText = submitBtn.textContent;
        submitBtn.textContent = "Проверка ссылки...";
        submitBtn.disabled = true;

        let meta;
        try {
            // 1) Строгая валидация + метаданные. Если упало — прерываемся здесь,
            //    createVideo НЕ вызывается, видео не создаётся.
            ({ meta } = await fetchVideoMetadata(url));
        } catch (err) {
            console.error("[add-video] проверка ссылки не прошла:", err);
            alert("Не удалось добавить видео: " + err.message);
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            return;   // ← выходим, ничего не создаём
        }

        // 2) Ссылка валидна — создаём видео
        submitBtn.textContent = "Загрузка...";
        try {
            const created = await createVideo(token, {
                url,
                tagIds: selectedTags,
            });

            // 3) Сохраняем уже полученные метаданные под id нового видео,
            //    чтобы не дёргать oEmbed ещё раз при рендере.
            if (created?.id != null) {
                saveMetadata(created.id, meta, url, selectedTags);
            }

            form.reset();
            if (onSuccess) await onSuccess();
            getContainer("add-window")?.classList.remove("show");
            getContainer("add-window-overlay")?.classList.remove("show");
        } catch (err) {
            console.error("[add-video] createVideo упал:", err);
            alert("Ошибка при добавлении: " + err.message);
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });
}