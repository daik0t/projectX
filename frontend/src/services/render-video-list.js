import { getMyVideos, getOembed } from "../api/video";
import { videoCardRender } from "../components/videoCard";
import { getMetadata, saveMetadata } from "./video-storage";



export async function renderVideoList(container, token, tags) {

    if (!container) {
        console.warn('renderVideoList: контейнер не передан');
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

        for (const video of videos){
            const { id, url, tags = [] } = video;
            if (getMetadata(id)) continue;
            const re = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?(?:[^#]*&)?v=|youtu\.be\/)([\w-]{11})/;
            const endpoint = url.match(re)?.[1];
            if (!endpoint) continue;
            const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(
                `https://www.youtube.com/watch?v=${endpoint}`
            )}&format=json`;
            const meta = await getOembed(url, oembedUrl);
            saveMetadata(id, meta, url, tags);
        }

        container.innerHTML = (
        await Promise.all(videos.map(video => videoCardRender(video)))
        ).join('');
        
    } catch (error) {
        container.innerHTML = `<p class="error">Ошибка загрузки: ${error.message}</p>`;
    }
}