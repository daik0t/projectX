import { getMyVideos } from "../api/video";
import { videoCardRender } from "../components/videoCard";
import { ensureVideosMetadata } from "./video-storage";
import { escapeHtml } from "../lib/html";

export async function renderVideoList(container, token, tags = []) {
    if (!container) {
        console.warn("renderVideoList: контейнер не передан");
        return;
    }

    try {
        const hasFilter = Array.isArray(tags) && tags.length > 0;
        const videos = hasFilter
            ? await getMyVideos(token, tags)
            : await getMyVideos(token);

        if (!videos || videos.length === 0) {
            container.innerHTML = hasFilter
                ? "<p>По выбранным тегам видео не найдены.</p>"
                : "<p>У вас пока нет видео.</p>";
            return;
        }

        await ensureVideosMetadata(videos);

        container.innerHTML = (
            await Promise.all(videos.map((video) => videoCardRender(video)))
        ).join("");
    } catch (error) {
        if (error?.status === 401) return;

        container.innerHTML = `<p class="error">Ошибка загрузки: ${escapeHtml(error.message)}</p>`;
    }
}
