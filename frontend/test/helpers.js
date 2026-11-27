import { testTags, testUser, testVideos } from './msw/server';

export function seedSession(user = testUser) {
    localStorage.setItem('accessToken', 'test-token');
    localStorage.setItem('tokenType', 'Bearer');
    localStorage.setItem('user', JSON.stringify(user));
}

export function seedMetadata(videos = testVideos) {
    const cache = {};

    videos.forEach((video, index) => {
        cache[video.id] = {
            id: video.id,
            title: `Видео ${index + 1}`,
            url: video.url,
            thumbnail_url: '',
            tags: video.tags.map((tag) => ({ ...tag })),
            savedAt: Date.now(),
        };
    });

    localStorage.setItem('yt_metadata:1', JSON.stringify(cache));
}

export function seedMain() {
    seedSession();
    seedMetadata();
}

export function tagByName(name) {
    return testTags.find((tag) => tag.name === name);
}
