// src/router.js
import { renderRegister } from "./pages/registerPage";
import { renderLogin }    from "./pages/loginPage";
import { renderMain }     from "./pages/mainPage";
import { renderSettingsPage } from "./pages/settingsPage";
import { getAuth, clearAuth } from "./services/auth-storage";   // ← добавь clearAuth
import { isAuthCallback, handleAuthCallback } from "./api/api";
import { renderForgotPassword } from "./pages/forgotPasswordPage";
import { renderResetPassword } from "./pages/resetPasswordPage";

const routes = {
    '/login':    () => renderLogin(),
    '/register': () => renderRegister(),
    '/':         () => renderMain(),
    '/settings': () => renderSettingsPage(),
    '/forgot-password': () => renderForgotPassword(),
    '/reset-password': () => renderResetPassword()
};

const PUBLIC_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password'];

// ── Хелпер: определить, что ошибка — это 401/Unauthorized
function isAuthError(error) {
    if (!error) return false;
    if (error.status === 401 || error.statusCode === 401) return true;
    const msg = String(error.message || '').toLowerCase();
    return (
        msg.includes('аутентификац') ||
        msg.includes('authenticat')  ||
        msg.includes('unauthorized') ||
        msg.includes('401')
    );
}

// ── Хелпер: нормализовать expiresAt (секунды → мс, ISO → ms)
function normalizeExpiresAt(v) {
    if (!v) return null;
    if (typeof v === 'number') return v < 1e12 ? v * 1000 : v; // секунды → мс
    if (typeof v === 'string') {
        const n = Number(v);
        if (!Number.isNaN(n)) return n < 1e12 ? n * 1000 : n;
        const parsed = Date.parse(v);
        return Number.isNaN(parsed) ? null : parsed;
    }
    return null;
}

export async function router() {
    const app = document.getElementById('app');

    document.querySelectorAll('body > .dropdown').forEach(el => el.remove());

    // 1. OAuth-колбэк
    if (isAuthCallback()) {
        try {
            await handleAuthCallback();
            window.location.replace('/');
        } catch (err) {
            window.location.replace('/login?error=' + encodeURIComponent(err.message));
        }
        return;
    }

    let path = window.location.pathname;

    // 2. Проверка токена
    const auth = getAuth();
    const expiresAt = normalizeExpiresAt(auth?.expiresAt);
    const tokenValid =
        !!auth?.accessToken &&
        (expiresAt === null || expiresAt > Date.now());

    const isPublic = PUBLIC_ROUTES.includes(path);

    if (!tokenValid && !isPublic) {
        history.replaceState({}, '', '/login');
        path = '/login';
    } else if (tokenValid && path === '/login') {
        history.replaceState({}, '', '/');
        path = '/';
    }

    // 3. Поиск роута
    let matchedRoute = null;
    let params = {};

    for (const route in routes) {
        if (route.includes(':')) {
            const pattern = route.replace(/:\w+/g, '([^/]+)');
            const regex = new RegExp(`^${pattern}$`);
            const match = path.match(regex);
            if (match) {
                matchedRoute = routes[route];
                const keys = route.match(/:\w+/g) || [];
                keys.forEach((key, index) => {
                    params[key.slice(1)] = match[index + 1];
                });
                break;
            }
        } else if (route === path) {
            matchedRoute = routes[route];
            break;
        }
    }

    // 4. Рендер с обработкой 401
    if (matchedRoute) {
        try {
            await matchedRoute(params);
        } catch (error) {
            if (isAuthError(error)) {
                // Токен невалиден по мнению сервера — сбрасываем и уводим на логин
                try { clearAuth(); } catch (_) {}
                history.replaceState({}, '', '/login');
                await renderLogin(error.message);
                return;
            }
            app.innerHTML =
                `<div class="alert alert-danger">Ошибка: ${error.message}</div>`;
        }
    } else {
        app.innerHTML = '<h1>404 - Страница не найдена</h1>';
    }
}

export function navigate(path) {
    if (path === window.location.pathname) return;
    history.pushState({}, '', path);
    router();
}