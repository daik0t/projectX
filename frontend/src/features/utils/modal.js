export function initModal({ openBtnId, overlayId, windowId, onOpen, onClose }) {
    const openBtn = document.getElementById(openBtnId);
    const overlay = document.getElementById(overlayId);
    const modalWindow = document.getElementById(windowId);

    if (!overlay || !modalWindow) return null;

    const ac = new AbortController();
    const { signal } = ac;

    function open() {
        overlay.classList.add('show');
        modalWindow.classList.add('show');
        if (onOpen) onOpen();
    }

    function close() {
        overlay.classList.remove('show');
        modalWindow.classList.remove('show');
        if (onClose) onClose();
    }

    if (openBtn) openBtn.addEventListener('click', open, { signal });
    overlay.addEventListener('click', close, { signal });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') close();   
    }, { signal });

    return { open, close, destroy: () => ac.abort() };
}