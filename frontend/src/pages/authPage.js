import { initAuthForm, authFormRender } from "../components/authForm"; 
import { mountSocialAuth } from "../components/socialAuth";
import { navigate } from "../lib/navigation";
import { saveAuth } from "../services/auth-storage";
import { startSocialAuth } from "../services/auth-social";
import { showToast } from "../lib/ui";

export function renderAuthPage({
    mode,
    title,
    dividerText,
    linkText,
    linkHref,
    linkPrompt,
    message = null,
    root = document.getElementById('app'),
}) {
    if (!root) return;

    root.innerHTML = `
        <div class="auth-widget-card">
            <div class="auth-widget-title">${title}</div>
            ${authFormRender(mode)}
            <div class="auth-widget-divider">${dividerText}</div>
            <div class="auth-widget-socials" aria-label="Вход через соцсети"></div>
            <hr class="widget-line">
            <div class="auth-away">
                <span class="auth-away-title">${linkPrompt}</span>
                <a id="auth-link" class="auth-away-link" href="${linkHref}" data-link>${linkText}</a>
            </div>
        </div>
    `;

    if (message) {
        const messageEl = root.querySelector('#auth-message');
        if (messageEl) {
            messageEl.hidden = false;
            messageEl.textContent = message;
            messageEl.dataset.type = 'error';
        }
    }

    initAuthForm(mode, async (data) => {
        if (mode === 'register') {
            navigate('/login');
            return;
        }

        try {
            await saveAuth(data);
            navigate('/');
        } catch (err) {
            showToast(err.message, 'error');
        }
    }, root);

    const socialContainer = root.querySelector('.auth-widget-socials');

    mountSocialAuth(socialContainer, {
        onError: (err) => showToast(err.message, 'error'),
    }, {
        google: (container, handlers) => startSocialAuth('google', container, handlers),
        github: (container, handlers) => startSocialAuth('github', container, handlers),
    });
}
