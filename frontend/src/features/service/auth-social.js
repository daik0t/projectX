import { startProviderAuth } from '../api/api.js';
import { setButtonLoading, getProviderButton } from '../components/socialAuth.js';

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