import { expect } from '@playwright/test';

export const testUser = {
    id: 1,
    displayName: 'Tester',
    email: 'test@example.com',
    createdAt: '2025-01-01T00:00:00Z',
};

export const testTags = [
    { id: 1, name: 'Категория' },
    { id: 2, name: 'Фильтр' },
    { id: 3, name: 'Неиспользуемый' },
];

export const initialVideos = [
    {
        id: 1,
        url: 'https://youtu.be/aaaaaaaaaaa',
        tags: [{ id: 1, name: 'Категория' }, { id: 2, name: 'Фильтр' }],
    },
    {
        id: 2,
        url: 'https://youtu.be/bbbbbbbbbbb',
        tags: [{ id: 1, name: 'Категория' }],
    },
];

function metadataFor(videos) {
    return Object.fromEntries(videos.map((video, index) => [
        video.id,
        {
            id: video.id,
            title: `Видео ${index + 1}`,
            url: video.url,
            thumbnail_url: '',
            tags: video.tags,
            savedAt: Date.now(),
        },
    ]));
}

function json(route, data, status = 200) {
    return route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(data),
    });
}

export async function mockApi(page, { auth = true } = {}) {
    let videos = [...initialVideos];

    await page.route((url) => url.pathname.startsWith('/api/'), async (route) => {
        const request = route.request();
        const url = new URL(request.url());
        const method = request.method();

        if (url.pathname === '/api/users/me') {
            return json(route, testUser);
        }
        if (url.pathname === '/api/tags' && method === 'GET') {
            return json(route, testTags);
        }
        if (url.pathname.startsWith('/api/tags/') && method === 'DELETE') {
            return route.fulfill({ status: 204, body: '' });
        }
        if (url.pathname === '/api/videos/me') {
            return json(route, videos);
        }
        if (url.pathname === '/api/auth/login' && method === 'POST') {
            return json(route, {
                accessToken: 'test-token',
                tokenType: 'Bearer',
                expiresIn: 3600,
                user: testUser,
            });
        }
        if (url.pathname === '/api/auth/register' && method === 'POST') {
            return json(route, { message: 'Зарегистрировано' }, 201);
        }
        if (url.pathname.startsWith('/api/videos/') && url.pathname.endsWith('/tags') && method === 'PUT') {
            const id = Number(url.pathname.split('/')[3]);
            const body = request.postDataJSON();
            const video = videos.find((item) => item.id === id);
            if (!video) return route.fulfill({ status: 404, body: 'not found' });
            video.tags = body.tagIds
                .map((tagId) => testTags.find((tag) => tag.id === tagId))
                .filter(Boolean);
            return json(route, video);
        }
        if (url.pathname.startsWith('/api/videos/') && method === 'DELETE') {
            const id = Number(url.pathname.split('/').pop());
            videos = videos.filter((video) => video.id !== id);
            return route.fulfill({ status: 204, body: '' });
        }
        if (url.pathname === '/api/videos' && method === 'POST') {
            const body = request.postDataJSON();
            const created = { id: 3, url: body.url, tags: [] };
            videos = [created, ...videos];
            return json(route, created, 201);
        }

        return route.fulfill({ status: 404, body: 'not found' });
    });

    await page.route(/youtube\.com\/oembed/, (route) => route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
            title: 'Новое видео',
            thumbnail_url: 'https://example.com/thumb.jpg',
            author_name: 'Author',
            provider_name: 'YouTube',
        }),
    }));

    const metadata = metadataFor(initialVideos);

    // addInitScript с localStorage ненадёжен на about:blank, поэтому
    // сначала открываем origin, затем заполняем хранилище.
    await page.goto('/login');
    await page.evaluate(({ user, cache, withAuth }) => {
        if (withAuth) {
            localStorage.setItem('accessToken', 'test-token');
            localStorage.setItem('tokenType', 'Bearer');
            localStorage.setItem('user', JSON.stringify(user));
        }
        localStorage.setItem('yt_metadata:1', JSON.stringify(cache));
    }, { user: testUser, cache: metadata, withAuth: auth });
}

export async function waitForMain(page) {
    await expect(page.locator('.video-card')).toHaveCount(2);
    await expect(page.getByText('Видео 1')).toBeVisible();
}
