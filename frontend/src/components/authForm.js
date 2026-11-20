import { registerUser, loginUser } from '../api/auth.js';

const DISPLAY_NAME_RE = /^[a-zA-Z0-9_]+$/;

export function authFormRender(mode) {
        
    const displayNameField = mode === 'register'
        ? `
            <div class="auth-widget-group">
                <input
                    id="displayName"
                    type="text"
                    name="displayName"
                    placeholder="имя"
                    aria-label="Имя пользователя"
                    autocomplete="username"
                    minlength="3"
                    maxlength="30"
                    pattern="[A-Za-z0-9_]+"
                    title="3–30 символов: латиница, цифры и _"
                    required
                >
            </div>
        `
        : '';



    const forgotLink = mode === 'login'
        ? `
            <div class="auth-widget-forgot">
                <a href="/forgot-password" class="auth-widget-forgot-link" data-link>
                    Забыли пароль?
                </a>
            </div>
        `
        : '';


    return `
        <form id="auth-widget-form">
            ${displayNameField}
            <div class="auth-widget-group">
                <input
                    id="email"
                    type="email"
                    name="email"
                    placeholder="почта"
                    aria-label="Email"
                    autocomplete="email"
                    maxlength="255"
                    required
                >
            </div>
            <div class="auth-widget-group">
                <input
                    id="password"
                    type="password"
                    name="password"
                    placeholder="пароль"
                    aria-label="Пароль"
                    autocomplete="${mode === 'register' ? 'new-password' : 'current-password'}"
                    ${mode === 'register' ? 'minlength="8"' : ''}
                    maxlength="100"
                    required
                >
            </div>

            ${forgotLink}

            <div class="auth-widget-message" id="auth-message" role="alert" aria-live="polite" hidden></div>

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

        if (mode === 'register' && password.length < 8) {
            showMessage(messageEl, 'Пароль должен быть не короче 8 символов', 'error');
            return;
        }

        let payload;
        if (mode === 'register') {
            const displayName = formData.get('displayName')?.toString().trim() ?? '';
            if (displayName.length < 3 || displayName.length > 30 || !DISPLAY_NAME_RE.test(displayName)) {
                showMessage(messageEl, 'Имя: 3–30 символов, латиница, цифры и _', 'error');
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
            await onSuccess?.(result);
        } catch (error) {
            const fieldError = error?.status === 400
                && error.details
                && typeof error.details === 'object'
                ? Object.values(error.details)[0]
                : null;

            showMessage(messageEl, fieldError || error.message, 'error');
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
