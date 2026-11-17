import { request } from "./api";

export function registerUser({ displayName, email, password }) {
    return request('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ displayName, email, password }),
        auth: false,
    });
}

export function loginUser({ email, password }) {
    return request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
        auth: false,
    });
}

export function me() {
    return request('/api/users/me', { method: 'GET' });
}

export function forgotPassword({ email }) {
    return request('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
        auth: false,
    });
}

export function resetPassword({ token, newPassword }) {
    return request('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, newPassword }),
        auth: false,
    });
}
