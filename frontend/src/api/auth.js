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

export async function me(token) {
    return request('/api/users/me', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });
}

export function forgotPassword({ email }) {
    return request('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
    });
}

export function resetPassword({ token, newPassword }) {
    return request('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, newPassword }),
    });
}
