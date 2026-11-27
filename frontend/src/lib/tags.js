export function collectSelectedTags(root) {
    if (!root) return [];

    return [...root.querySelectorAll('input[name="tags"]:checked')].map((cb) => ({
        id: cb.value,
        name: cb.closest('.tag-item')?.querySelector('.tag-button')?.textContent?.trim() || cb.value,
    }));
}
