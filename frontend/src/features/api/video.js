import { request } from "./api";

function getAuthHeaders(token) {
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
    };
}

export function createTag(token, { name }) {
    return request('/api/tags', {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: JSON.stringify({ name }),
    });
}

export function getTags(token) {
    return request('/api/tags', {
        method: 'GET',
        headers: getAuthHeaders(token),
    });
}

export function createVideo(token, { url, tagIds }) {
    const body = { url };
    if (tagIds && tagIds.length > 0) {
        body.tagIds = tagIds;
    }

    return request('/api/videos', {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: JSON.stringify(body),
    });
}

export function getMyVideos(token) {
    return request('/api/videos/me', {
        method: 'GET',
        headers: getAuthHeaders(token),
    });
}

export function updateVideoTags(token, videoId, tagIds) {
    return request(`/api/videos/${videoId}/tags`, {
        method: 'PUT',
        headers: getAuthHeaders(token),
        body: JSON.stringify({ tagIds }),
    });
}

export function deleteVideo(token, videoId) {
    return request(`/api/videos/${videoId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(token),
    });
}