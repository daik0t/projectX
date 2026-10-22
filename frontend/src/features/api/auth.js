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
