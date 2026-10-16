// src/router.js
import { renderRegister } from "./features/pages/registerPage";
import { renderLogin }    from "./features/pages/loginPage";
import { renderMain }     from "./features/pages/mainPage";

const routes = {
    '/login':    () => renderLogin(),
    '/register': () => renderRegister(),
    '/':         () => renderMain(),
};

export async function router() {
    const path = window.location.pathname;
    const app = document.getElementById('app');

    document.querySelectorAll('body > .dropdown').forEach(el => el.remove());

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