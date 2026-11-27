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

export function createTag({ name }) {
    return request('/api/tags', {
        method: 'POST',
        body: JSON.stringify({ name }),
    }).then(normalizeTag);
}

export function getTags() {
    return request('/api/tags', { method: 'GET' })
        .then((tags) => (Array.isArray(tags) ? tags.map(normalizeTag) : []));
}

export function createVideo({ url, tagIds }) {
    const body = { url };
    if (tagIds && tagIds.length > 0) {
        body.tagIds = tagIds;
    }

    return request('/api/videos', {
        method: 'POST',
        body: JSON.stringify(body),
    }).then(normalizeVideo);
}

export function getMyVideos() {
    return request('/api/videos/me', { method: 'GET' })
        .then((videos) => (Array.isArray(videos) ? videos.map(normalizeVideo) : []));
}

export function updateVideoTags(videoId, tagIds) {
    return request(`/api/videos/${videoId}/tags`, {
        method: 'PUT',
        body: JSON.stringify({ tagIds }),
    }).then(normalizeVideo);
}

export function deleteVideo(videoId) {
    return request(`/api/videos/${videoId}`, {
        method: 'DELETE',
    });
}

export function deleteTag(tagId) {
    return request(`/api/tags/${tagId}`, {
        method: 'DELETE',
    });
}
