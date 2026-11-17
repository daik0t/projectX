// src/router.js
import { renderRegister } from "./pages/registerPage";
import { renderLogin }    from "./pages/loginPage";
import { renderMain }     from "./pages/mainPage";
import { renderSettingsPage } from "./pages/settingsPage";
import { getSession, isSessionExpired, clearSession } from "./services/session";
import { resetPage } from "./lib/page-lifecycle";
import { escapeHtml } from "./lib/html";
import { isAuthCallback, handleAuthCallback } from "./services/oauth";
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

export async function router() {
    const app = resetPage();

    let path = window.location.pathname;

    if (isAuthCallback()) {
        try {
            await handleAuthCallback();
            history.replaceState({}, '', '/');
            path = '/';
        } catch (err) {
            history.replaceState(
                {},
                '',
                '/login?error=' + encodeURIComponent(err.message || 'Не удалось войти')
            );
            path = '/login';
        }
    }

    let session = getSession();
    if (session.accessToken && isSessionExpired()) {
        clearSession();
        session = getSession();
    }
    const tokenValid = Boolean(session.accessToken);
    const isPublic = PUBLIC_ROUTES.includes(path);

    if (!tokenValid && !isPublic) {
        history.replaceState({}, '', '/login');
        path = '/login';
    } else if (tokenValid && path === '/login') {
        history.replaceState({}, '', '/');
        path = '/';
    }

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

    if (matchedRoute) {
        try {
            await matchedRoute(params);
        } catch (error) {
            if (error?.status === 401) return;

            app.innerHTML =
                `<div class="alert alert-danger">Ошибка: ${escapeHtml(error?.message ?? 'Неизвестная ошибка')}</div>`;
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
