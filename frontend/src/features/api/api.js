const API_BASE_URL = 'http://localhost:8080';

export async function request(path, options = {}) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {}),
        },
        ...options,
    });

    let data = null;
    try {
        data = await response.json();
    } catch {

    }

    if (!response.ok) {
        const message = data?.message || data?.error || `Ошибка ${response.status}`;
        throw new Error(message);
    }

    return data;
}