import "../style/widgets/dropdown.css"

export function dropdownRender() {
    return `
        <div id="dropdown" class="dropdown">
            <button class="dropdown-item">Тэг</button> <!-- Функция по определению всех тэгов -->
        </div>
    `;
}

export function initSearchDropdown(inputId, dropdownId) {
    const input = document.getElementById(inputId);
    const dropdown = document.getElementById(dropdownId);

    function openDropdown() {
        const rect = input.getBoundingClientRect();
        dropdown.style.top   = rect.bottom + 'px';
        dropdown.style.left  = rect.left + 'px';
        dropdown.style.width = rect.width + 'px';
        dropdown.classList.add('visible');
    }

    function closeDropdown() {
        dropdown.classList.remove('visible');
    }

    if (!input || !dropdown) {
        return;
    }

    input.addEventListener('focus', openDropdown);
    input.addEventListener('click', openDropdown)

    document.addEventListener('click', (e) => {
        if (!input.contains(e.target) && !dropdown.contains(e.target)) {
            closeDropdown();
        }
    });

    return { openDropdown, closeDropdown };
}