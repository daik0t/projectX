import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

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

export const testVideos = [
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

export const server = setupServer(
    http.get('http://localhost/api/users/me', () => HttpResponse.json(testUser)),
    http.get('http://localhost/api/tags', () => HttpResponse.json(testTags)),
    http.get('http://localhost/api/videos/me', () => HttpResponse.json(testVideos)),
    http.post('http://localhost/api/auth/login', () => HttpResponse.json({
        accessToken: 'test-token',
        tokenType: 'Bearer',
        expiresIn: 3600,
        user: testUser,
    })),
    http.post('http://localhost/api/auth/register', () =>
        HttpResponse.json({ message: 'Зарегистрировано' }, { status: 201 })
    ),
    http.post('http://localhost/api/auth/forgot-password', () =>
        HttpResponse.json({ message: 'Инструкции отправлены' })
    ),
    http.post('http://localhost/api/auth/reset-password', () =>
        HttpResponse.json({ message: 'Пароль изменён' })
    ),
    http.post('http://localhost/api/tags', async ({ request }) => {
        const body = await request.json();
        return HttpResponse.json({ id: 4, name: body.name }, { status: 201 });
    }),
    http.post('http://localhost/api/videos', async ({ request }) => {
        const body = await request.json();
        return HttpResponse.json({
            id: 3,
            url: body.url,
            tags: [],
        }, { status: 201 });
    }),
    http.put('http://localhost/api/videos/:id/tags', async ({ request, params }) => {
        const body = await request.json();
        return HttpResponse.json({
            id: Number(params.id),
            url: 'https://youtu.be/aaaaaaaaaaa',
            tags: body.tagIds.map((id) => testTags.find((tag) => tag.id === id)).filter(Boolean),
        });
    }),
    http.delete('http://localhost/api/videos/:id', () => new HttpResponse(null, { status: 204 })),
    http.delete('http://localhost/api/tags/:id', () => new HttpResponse(null, { status: 204 })),
    http.get('https://www.youtube.com/oembed*', () => HttpResponse.json({
        title: 'Новое видео',
        thumbnail_url: 'https://example.com/thumb.jpg',
        author_name: 'Author',
        provider_name: 'YouTube',
    })),
    http.get('https://vimeo.com/api/oembed.json*', () => HttpResponse.json({
        title: 'Vimeo видео',
        thumbnail_url: 'https://example.com/vimeo.jpg',
        author_name: 'Author',
        provider_name: 'Vimeo',
    }))
);
