import { startProviderAuth } from './auth.js';
import { setButtonLoading, getProviderButton } from './social-auth-render.js';

export function startSocialAuth(provider, container, handlers) {
    try {
        const btn = getProviderButton(container, provider);
        setButtonLoading(btn, true);

        startProviderAuth(provider);
    } catch (err) {
        console.error(`${provider} auth failed:`, err);
        handlers?.onError?.(err);
        const btn = getProviderButton(container, provider);
        setButtonLoading(btn, false);
    }
}