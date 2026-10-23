import { request } from "./api";



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


export async function logout() {
    return request(`/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
    });
}

export async function me(token) {
    return request('/api/auth/me', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });
}
