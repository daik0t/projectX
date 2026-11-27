export function getContainer(id, root = document) {
    const element = root?.querySelector?.(`#${id}`) ?? document.getElementById(id);

    if (!element) {
        console.warn(`[dom] #${id} not found`);
    }

    return element;
}
