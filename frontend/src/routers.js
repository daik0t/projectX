// src/router.js
import { renderRegister } from "./features/pages/registerPage";
import { renderLogin }    from "./features/pages/loginPage";
import { renderMain }     from "./features/pages/mainPage";
import { me } from "./features/api/auth";
import { renderSettings } from "./features/pages/settingsPage";

const routes = {
    '/login':    () => renderLogin(),
    '/register': () => renderRegister(),
    '/':         () => renderMain(),
    '/settings': () => renderSettings()
};

let authCache;

export async function getAuth({ force = false } = {}) {
    if (!force && authCache !== undefined) return authCache;
    try {
        authCache = await me();      // 401 → null, 200 → объект
    } catch {
        authCache = null;                 // сеть упала — считаем гостем
    }
    return authCache;
}

export function clearAuthCache() { authCache = undefined; }
export function setAuth(user)    { authCache = user; }


export async function router() {
    const path = window.location.pathname;
    const app  = document.getElementById('app');

    document.querySelectorAll('body > .dropdown').forEach(el => el.remove());
    /*
    if (path === '/') {
        const user = await getAuth();
        if (!user) {

            history.replaceState({}, '', '/login');
            await renderLogin();
            return;
        }

    }
    */
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
            app.innerHTML = `<div class="alert alert-danger">Ошибка: ${error.message}</div>`;
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