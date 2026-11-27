export function navigate(path) {
    if (typeof path !== 'string') return;

    const next = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (path === next) return;

    history.pushState({}, '', path);
    window.dispatchEvent(new CustomEvent('route:navigate'));
}
