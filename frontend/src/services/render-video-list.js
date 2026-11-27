import { getMyVideos } from "../api/video";
import { videoCardRender, updateVideoCard } from "../components/videoCard";
import { ensureVideosMetadata, applyVideoTags } from "./video-storage";
import { escapeHtml } from "../lib/html";
import { filterVideos, hasVideoTag } from "../lib/video-filter";

let renderGeneration = 0;

function skeletonHtml(count = 6) {
    return Array.from({ length: count }, () => `
        <div class="video-card skeleton-card" aria-hidden="true">
            <div class="skeleton skeleton-preview"></div>
            <div class="skeleton skeleton-line"></div>
        </div>
    `).join("");
}

function announceRendered(container) {
    container.dispatchEvent(new CustomEvent("video-list:rendered"));
}

function drawCards(container, videos) {
    container.innerHTML = videos.map(videoCardRender).join("");
    announceRendered(container);
}

export async function renderVideoList(container, token, filter = {}) {
    if (!container) {
        console.warn("renderVideoList: контейнер не передан");
        return;
    }

    const requestId = ++renderGeneration;
    container.setAttribute("aria-busy", "true");

    if (!container.querySelector(".video-card")) {
        container.innerHTML = skeletonHtml();
    }

    try {
        const allVideos = await getMyVideos(token);

        if (requestId !== renderGeneration || !container.isConnected) return;

        const videos = filterVideos(allVideos, filter);
        const hasCategory = Boolean(filter?.categoryTagId)
            && allVideos.some((video) => hasVideoTag(video, filter.categoryTagId));
        const hasFilter = hasCategory || (filter?.filterTagIds?.length ?? 0) > 0;

        container.dispatchEvent(new CustomEvent("video-list:loaded", {
            detail: { videos: allVideos },
        }));

        if (videos.length === 0) {
            container.innerHTML = hasFilter
                ? "<p>По выбранным тегам видео не найдены.</p>"
                : "<p>У вас пока нет видео.</p>";
            container.setAttribute("aria-busy", "false");
            announceRendered(container);
            return;
        }

        drawCards(container, videos);
        applyVideoTags(videos);
        container.setAttribute("aria-busy", "false");

        ensureVideosMetadata(videos, {
            concurrency: 4,
            onEach: (video) => {
                if (requestId !== renderGeneration || !container.isConnected) return;

                const card = container.querySelector(
                    `.video-card[data-video-id="${String(video.id)}"]`
                );
                if (!card) return;

                updateVideoCard(card, video);
                announceRendered(container);
            },
        }).catch((error) => {
            console.warn("[render-video-list] metadata enrichment failed:", error);
        });
    } catch (error) {
        if (requestId !== renderGeneration || !container.isConnected) return;
        if (error?.status === 401) return;

        container.setAttribute("aria-busy", "false");
        container.innerHTML = `
            <div class="error-state" role="alert">
                <p>Не удалось загрузить видео: ${escapeHtml(error.message)}</p>
                <button type="button" class="retry-btn">Повторить</button>
            </div>
        `;

        container.querySelector(".retry-btn")?.addEventListener("click", () => {
            renderVideoList(container, token, filter);
        }, { once: true });
    }
}
