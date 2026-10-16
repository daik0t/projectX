const API_BASE_URL = 'http://localhost:8080';

async function request(path, options = {}) {
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

export function registerUser({ displayName, email, password }) {
    return request('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ displayName, email, password }),
    });
}

export function loginUser({ email, password }) {
    return request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });
}

//GET на получения данных видео