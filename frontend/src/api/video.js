import { request } from "./api";

function normalizeTag(tag) {
    if (tag && typeof tag === "object") {
        return { id: tag.id, name: String(tag.name ?? "") };
    }
    return { id: tag, name: "" };
}

function normalizeVideo(video) {
    if (!video || typeof video !== "object") return video;
    return {
        ...video,
        tags: Array.isArray(video.tags) ? video.tags.map(normalizeTag) : [],
    };
}

export function createTag(token, { name }) {
    return request('/api/tags', {
        method: 'POST',
        body: JSON.stringify({ name }),
    }).then(normalizeTag);
}

export function getTags(token) {
    return request('/api/tags', { method: 'GET' })
        .then((tags) => (Array.isArray(tags) ? tags.map(normalizeTag) : []));
}

export function createVideo(token, { url, tagIds }) {
    const body = { url };
    if (tagIds && tagIds.length > 0) {
        body.tagIds = tagIds;
    }

    return request('/api/videos', {
        method: 'POST',
        body: JSON.stringify(body),
    }).then(normalizeVideo);
}

export function getMyVideos(token, tags) {
    const params = new URLSearchParams();
    (tags ?? []).forEach((id) => params.append("tagIds", id));
    const query = params.toString();
    const url = `/api/videos/me${query ? `?${query}` : ""}`;

    return request(url, { method: 'GET' })
        .then((videos) => (Array.isArray(videos) ? videos.map(normalizeVideo) : []));
}

export function updateVideoTags(token, videoId, tagIds) {
    return request(`/api/videos/${videoId}/tags`, {
        method: 'PUT',
        body: JSON.stringify({ tagIds }),
    }).then(normalizeVideo);
}

export function deleteVideo(token, videoId) {
    return request(`/api/videos/${videoId}`, {
        method: 'DELETE',
    });
}

export function deleteTag(token, tagId) {
    return request(`/api/tags/${tagId}`, {
        method: 'DELETE',
    });
}
