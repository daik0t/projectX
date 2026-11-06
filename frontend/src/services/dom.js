export function getContainer(id) {
    const element = document.getElementById(id);
    
    if (!element) {
        console.warn(``);
    }
    
    return element;
}