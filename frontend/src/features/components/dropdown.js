export function dropdownRender({ asList = false } = {}) {
    const cls = asList ? 'dropdown dropdown--list' : 'dropdown';
    return `
        <div class="${cls}">
            <div class = "tags-container" style="display: flex; flex-wrap: wrap; gap: 10px;">
                <div class="tag">Тэг 1</div>
                <div class="tag">Тэг 2</div>
                <div class="tag">Тэг 3</div>
                <div class="tag">Тэг 4</div>
            </div>
            <button class="add-btn" type = "button">Добавить</button>
    
            <div class="input-group hidden" >
                <input type="text" class = "new-tags-input" name = "new-tags-input" placeholder="Новый тэг...">
                <button class="save-btn" type = "button">✓</button>
            </div>
        </div>
    `;
}

export function initDropdown(inputId) {

    const input = document.getElementById(inputId);

    if (!input) return;


    
    const container = input.closest('form') || input.parentElement;
    
    const dropdown = container.querySelector('.dropdown');
    if (!dropdown) return;

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
    }

    input.addEventListener('focus', (e) => {openDropdown(e)});
    input.addEventListener('click', (e) => {openDropdown(e)})

    document.addEventListener('click', (e) => {
        if (!input.contains(e.target) && !dropdown.contains(e.target)) {
            closeDropdown();
        }
    });

    tagsContainer.addEventListener('click', (e) => {
      if (e.target.classList.contains('tag')) {
        e.target.classList.toggle('selected');
      }
    });

    addBtn.addEventListener('click', () => {
      addBtn.classList.add('hidden');
      inputGroup.classList.remove('hidden');
      newTagInput.focus();
    });

    saveBtn.addEventListener('click', () => {
      const text = newTagInput.value.trim();
      if (text) {
        const newTag = document.createElement('div');
        newTag.className = 'tag';
        newTag.textContent = text;
        
        tagsContainer.appendChild(newTag);
      }
      

      newTagInput.value = '';
      inputGroup.classList.add('hidden');
      addBtn.classList.remove('hidden');
    });

    newTagInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        saveBtn.click();
      }
    });

    return { openDropdown, closeDropdown, reset };
}

export function initList(inputId) {
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
    }


    function getSelected() {
        return Array.from(dropdown.querySelectorAll('.tag.selected'))
            .map(t => t.textContent.trim());
    }



    tagsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('tag')) {
            e.target.classList.toggle('selected');
        }
    });

    addBtn.addEventListener('click', () => {
        addBtn.classList.add('hidden');
        inputGroup.classList.remove('hidden');
        newTagInput.focus();
    });

    saveBtn.addEventListener('click', () => {
        const text = newTagInput.value.trim();
        if (text) {
            const newTag = document.createElement('div');
            newTag.className = 'tag';
            newTag.textContent = text;
            tagsContainer.appendChild(newTag);
        }
        newTagInput.value = '';
        inputGroup.classList.add('hidden');
        addBtn.classList.remove('hidden');
    });

    newTagInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') saveBtn.click();
    });

    return { reset, getSelected };
}

