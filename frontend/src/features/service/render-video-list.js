import { getMyVideos } from "../api/video";
import { videoCardRender } from "../components/videoCard";

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

        container.innerHTML = videos.map(video => videoCardRender(video)).join('');
        
    } catch (error) {
        container.innerHTML = `<p class="error">Ошибка загрузки: ${error.message}</p>`;
    }
}