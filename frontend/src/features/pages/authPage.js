import { authFormRender } from "../components/authForm"; 
import { socialAuthRender } from "../components/socialAuth";
import { initAuthForm } from "../components/authForm";
import { navigate } from "../../routers";
import { saveAuth } from "../service/auth-storage";
import { mountSocialAuth} from "../components/socialAuth";
import { startSocialAuth } from "../service/auth-social";

export function renderAuthPage({ mode, title, dividerText, linkText, linkHref, linkPrompt }) {
    const container = document.getElementById('app');

    container.innerHTML = `
        <div class="auth-widget-card">
            <div class="auth-widget-title">${title}</div>
            ${authFormRender(mode)}
            <div class="auth-widget-divider">${dividerText}</div>
            ${socialAuthRender()}
            <hr class="widget-line">
            <div class="auth-away">
                <span class="auth-away-title">${linkPrompt}</span>
                <a id="auth-link" class="auth-away-link" href="${linkHref}" data-link>${linkText}</a>
            </div>
        </div>
    `;

    initAuthForm(mode, (data) => {
        if (mode != 'register'){
            saveAuth(data)
            navigate('/login');
        }
        else{
            navigate('/login')
        }
    });

    const socialContainer = app.querySelector('.auth-widget-socials');

    mountSocialAuth(socialContainer, {
    onError: (err) => showToast(err.message),
    }, {
        google: (container, handlers) => startSocialAuth('google', container, handlers),
        github: (container, handlers) => startSocialAuth('github', container, handlers),
    });
}