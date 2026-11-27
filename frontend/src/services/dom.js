export function getContainer(id) {
    const element = document.getElementById(id);
    
    if (!element) {
        console.warn(`[dom] #${id} not found`);
    }
    
    return element;
}