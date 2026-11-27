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

let routeGeneration = 0;

export async function router() {
    const generation = ++routeGeneration;
    const app = resetPage();

    // Не оставляем прокрутку предыдущей страницы.
    window.scrollTo(0, 0);

    let path = window.location.pathname;

    if (isAuthCallback()) {
        try {
            await handleAuthCallback();
            if (generation !== routeGeneration) return;
            history.replaceState({}, '', '/');
            path = '/';
        } catch (err) {
            if (generation !== routeGeneration) return;
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
        app.innerHTML = '<div class="page-loading" role="status">Загрузка…</div>';

        try {
            await matchedRoute(params);
        } catch (error) {
            if (generation !== routeGeneration) return;
            if (error?.status === 401) return;

            app.innerHTML = `
                <div class="error-state" role="alert">
                    <p>Ошибка: ${escapeHtml(error?.message ?? 'Неизвестная ошибка')}</p>
                    <a href="/" data-link>На главную</a>
                </div>
            `;
        }
    } else {
        app.innerHTML = `
            <div class="error-state" role="alert">
                <p>404 — страница не найдена</p>
                <a href="/" data-link>На главную</a>
            </div>
        `;
    }
}

export function navigate(path) {
    if (path === window.location.pathname) return;
    history.pushState({}, '', path);
    router();
}
