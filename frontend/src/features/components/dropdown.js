export function dropdownRender({ asList = false, tags = [] } = {}) {
    const cls = asList ? 'dropdown dropdown--list' : 'dropdown';
    const safeTags = Array.isArray(tags) ? tags : [];
    
    const tagsHtml = safeTags.map(tag => `
        <div class="tag" data-id="${tag.id || ''}">${tag.name || tag}</div>
    `).join('');

    return `
        <div class="${cls}">
            <div class="tags-container" style="display: flex; flex-wrap: wrap; gap: 10px;">
                ${tagsHtml}
            </div>
            <button class="add-btn" type="button">Добавить</button>
    
            <div class="input-group hidden">
                <input type="text" class="new-tags-input" name="new-tags-input" placeholder="Новый тэг...">
                <button class="save-btn" type="button">✓</button>
            </div>
        </div>
    `;
}

function appendTag(container, tagData, isSelected = false) {
    // Защита от дублей
    if (container.querySelector(`[data-id="${tagData.id}"]`)) return;

    const el = document.createElement('div');
    el.className = 'tag' + (isSelected ? ' selected' : '');
    el.dataset.id = tagData.id;
    el.textContent = tagData.name;
    container.appendChild(el);
}

export function initDropdown(inputId, { onCreateTag, onChange } = {}) {
    const input = document.getElementById(inputId);
    if (!input) return null;

    const container = input.closest('form') || input.parentElement;
    const dropdown = container.querySelector('.dropdown');
    if (!dropdown) return null;

    document.body.appendChild(dropdown);

    const tagsContainer = dropdown.querySelector('.tags-container');
    const addBtn = dropdown.querySelector('.add-btn');
    const inputGroup = dropdown.querySelector('.input-group');
    const newTagInput = dropdown.querySelector('.new-tags-input');
    const saveBtn = dropdown.querySelector('.save-btn');

    function openDropdown(e) {
        e.stopPropagation(); 
        const rect = input.getBoundingClientRect();
        dropdown.style.top   = rect.bottom + 'px';
        dropdown.style.left  = rect.left + 'px';
        dropdown.style.width = rect.width + 'px';
        dropdown.classList.add('visible');
    }

    function closeDropdown() {
        dropdown.classList.remove('visible');
    }

    function reset() {
        dropdown.querySelectorAll('.tag').forEach(t => t.classList.remove('selected'));
        newTagInput.value = '';
        inputGroup.classList.add('hidden');
        addBtn.classList.remove('hidden');
        closeDropdown();
        if (typeof onChange === 'function') onChange(getSelected());
    }

    function getSelected() {
        return Array.from(dropdown.querySelectorAll('.tag.selected'))
            .map(t => t.dataset.id ? Number(t.dataset.id) : t.textContent.trim())
            .filter(id => !isNaN(id));
    }

    function setSelected(tagIds) {
        dropdown.querySelectorAll('.tag').forEach(el => {
            const id = Number(el.dataset.id);
            if (tagIds.includes(id)) {
                el.classList.add('selected');
            } else {
                el.classList.remove('selected');
            }
        });
        if (typeof onChange === 'function') onChange(getSelected());
    }

    window.addEventListener('tagCreated', (e) => {
        appendTag(tagsContainer, e.detail);
    });

    input.addEventListener('focus', (e) => openDropdown(e));
    input.addEventListener('click', (e) => openDropdown(e));

    document.addEventListener('click', (e) => {
        if (!input.contains(e.target) && !dropdown.contains(e.target)) {
            closeDropdown();
        }
    });

    tagsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('tag')) {
            e.target.classList.toggle('selected');
            if (typeof onChange === 'function') onChange(getSelected());
        }
    });

    addBtn.addEventListener('click', () => {
        addBtn.classList.add('hidden');
        inputGroup.classList.remove('hidden');
        newTagInput.focus();
    });

    saveBtn.addEventListener('click', async () => {
        const text = newTagInput.value.trim();
        if (!text) return;

        try {
            saveBtn.disabled = true;
            const originalText = saveBtn.textContent;
            saveBtn.textContent = '...';

            let newTagData;
            if (onCreateTag) {
                newTagData = await onCreateTag(text);
            } else {
                newTagData = { id: `temp_${Date.now()}`, name: text };
            }

            appendTag(tagsContainer, newTagData, true);
            window.dispatchEvent(new CustomEvent('tagCreated', { detail: newTagData }));
            
            if (typeof onChange === 'function') onChange(getSelected());
            saveBtn.textContent = originalText;
        } catch (error) {
            console.error(error);
            alert('Ошибка при создании тега: ' + error.message);
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = '✓';
            newTagInput.value = '';
            inputGroup.classList.add('hidden');
            addBtn.classList.remove('hidden');
        }
    });

    newTagInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveBtn.click();
        }
    });

    return { openDropdown, closeDropdown, reset, getSelected, setSelected };
}

export function initList(inputId, { onCreateTag, onChange } = {}) {
    const input = document.getElementById(inputId);
    if (!input) return null;

    const container = input.closest('form') || input.parentElement;
    const dropdown = container.querySelector('.dropdown');
    if (!dropdown) return null;

    const tagsContainer = dropdown.querySelector('.tags-container');
    const addBtn        = dropdown.querySelector('.add-btn');
    const inputGroup    = dropdown.querySelector('.input-group');
    const newTagInput   = dropdown.querySelector('.new-tags-input');
    const saveBtn       = dropdown.querySelector('.save-btn');

    function reset() {
        dropdown.querySelectorAll('.tag').forEach(t => t.classList.remove('selected'));
        newTagInput.value = '';
        inputGroup.classList.add('hidden');
        addBtn.classList.remove('hidden');
        if (typeof onChange === 'function') onChange(getSelected());
    }

    function getSelected() {
        return Array.from(dropdown.querySelectorAll('.tag.selected'))
            .map(t => t.dataset.id ? Number(t.dataset.id) : t.textContent.trim())
            .filter(id => !isNaN(id));
    }

    function setSelected(tagIds) {
        dropdown.querySelectorAll('.tag').forEach(el => {
            const id = Number(el.dataset.id);
            if (tagIds.includes(id)) {
                el.classList.add('selected');
            } else {
                el.classList.remove('selected');
            }
        });
        if (typeof onChange === 'function') onChange(getSelected());
    }

    window.addEventListener('tagCreated', (e) => {
        appendTag(tagsContainer, e.detail);
    });

    tagsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('tag')) {
            e.target.classList.toggle('selected');
            if (typeof onChange === 'function') onChange(getSelected());
        }
    });

    addBtn.addEventListener('click', () => {
        addBtn.classList.add('hidden');
        inputGroup.classList.remove('hidden');
        newTagInput.focus();
    });

    saveBtn.addEventListener('click', async () => {
        const text = newTagInput.value.trim();
        if (!text) return;

        try {
            saveBtn.disabled = true;
            const originalText = saveBtn.textContent;
            saveBtn.textContent = '...';

            let newTagData;
            if (onCreateTag) {
                newTagData = await onCreateTag(text);
            } else {
                newTagData = { id: `temp_${Date.now()}`, name: text };
            }
            
            appendTag(tagsContainer, newTagData, true);
            window.dispatchEvent(new CustomEvent('tagCreated', { detail: newTagData }));
            
            if (typeof onChange === 'function') onChange(getSelected());
            saveBtn.textContent = originalText;
        } catch (error) {
            console.error(error);
            alert('Ошибка при создании тега: ' + error.message);
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = '✓';
            newTagInput.value = '';
            inputGroup.classList.add('hidden');
            addBtn.classList.remove('hidden');
        }
    });

    newTagInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveBtn.click();
        }
    });

    return { reset, getSelected, setSelected };
}