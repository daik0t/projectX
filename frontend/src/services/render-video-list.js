import { getMyVideos, getOembed } from "../api/video";
import { videoCardRender } from "../components/videoCard";
import { getMetadata, saveMetadata } from "./video-storage";



export async function renderVideoList(container, token) {

    if (!container) {
        console.warn('renderVideoList: контейнер не передан');
        return;
    }

    
    try {
        const videos = await getMyVideos(token);
        
        if (videos.length === 0) {
            container.innerHTML = '<p>У вас пока нет видео.</p>';
            return;
        }

        for (const video of videos){
            const { id, url, tags = [] } = video;
            const cached = getMetadata(id);
            if (cached) {
                continue;
            } else {
                const re = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?(?:[^#]*&)?v=|youtu\.be\/)([\w-]{11})/;
                const endpoint = url.match(re)?.[1];
                const oembedUrl =
                `https://www.youtube.com/oembed?url=${encodeURIComponent(
                    `https://www.youtube.com/watch?v=${endpoint}`
                )}&format=json`;
                const meta = await getOembed(url, oembedUrl);
                saveMetadata(id, meta, url, tags);
            }
        }

        container.innerHTML = (
        await Promise.all(videos.map(video => videoCardRender(video)))
        ).join('');
        
    } catch (error) {
        container.innerHTML = `<p class="error">Ошибка загрузки: ${error.message}</p>`;
    }
}