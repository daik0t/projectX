import { getMetadata } from "../services/video-storage";

export async function videoCardRender(video) {

    const data = getMetadata(video.id)

    return `
        <div class="video-card" data-video-id="${video.id}">
            <div class="card-preview">
                ${data.thumbnail_url
                    ? `<img src="${data.thumbnail_url}" alt="${data.title}">`
                    : `<img>`}
            </div>
            <div class="card-title">
                ${data.title}
            </div>
        </div>
    `;
}

