import { registerUser, loginUser } from '../api/auth.js';
import { navigate } from '../../routers.js';
export function authFormRender(mode) {
    const displayNameField = mode === 'register'
        ? `
            <div class="auth-widget-group">
                <input
                    id="displayName"
                    type="text"
                    name="displayName"
                    placeholder="имя"
                    required
                >
            </div>
        `
        : '';

    return `
        <form id="auth-widget-form" novalidate>
            ${displayNameField}
            <div class="auth-widget-group">
                <input
                    id="email"
                    type="email"
                    name="email"
                    placeholder="почта"
                    required
                    autocomplete="email"
                >
            </div>
            <div class="auth-widget-group">
                <input
                    id="password"
                    type="password"
                    name="password"
                    placeholder="пароль"
                    required
                    autocomplete="${mode === 'register' ? 'new-password' : 'current-password'}"
                >
            </div>

            <div class="auth-widget-message" id="auth-message" hidden></div>

            <div>
                <button class="auth-widget-submit" type="submit">Подтвердить</button>
            </div>
        </form>
    `;
}


export function initAuthForm(mode, onSuccess) {
    const form = document.getElementById('auth-widget-form');
    const messageEl = document.getElementById('auth-message');
    if (!form) return;

    const submitBtn = form.querySelector('.auth-widget-submit');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(form);
        const email = formData.get('email')?.toString().trim() ?? '';
        const password = formData.get('password')?.toString() ?? '';

        if (!email || !password) {
            showMessage(messageEl, 'Заполните все поля', 'error');
            return;
        }

        let payload;
        if (mode === 'register') {
            const displayName = formData.get('displayName')?.toString().trim() ?? '';
            if (!displayName) {
                showMessage(messageEl, 'Введите имя', 'error');
                return;
            }
            payload = { displayName, email, password };
        } else {
            payload = { email, password };
        }

        setLoading(submitBtn, true);
        showMessage(messageEl, '', null);

        try {
            const fn = mode === 'register' ? registerUser : loginUser;
            const result = await fn(payload);
            showMessage(messageEl, 'Успешно!', 'success');
            onSuccess?.(result);
        } catch (error) {
            showMessage(messageEl, error.message, 'error');
        } finally {
            setLoading(submitBtn, false);
        }
    });
}

function showMessage(el, text, type) {
    if (!el) return;
    if (!text) {
        el.hidden = true;
        el.textContent = '';
        return;
    }
    el.hidden = false;
    el.textContent = text;
    el.dataset.type = type;
}

function setLoading(btn, isLoading) {
    if (!btn) return;
    btn.disabled = isLoading;
    btn.textContent = isLoading ? 'Отправка...' : 'Подтвердить';
}