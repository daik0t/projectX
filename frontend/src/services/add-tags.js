export function initTagsList(root, { onCreateTag, onChange } = {}) {
    const container =
        typeof root === "string" ? document.getElementById(root) : root;
    if (!container) return null;

    const tagsContainer = container.querySelector("[data-tags-container]");
    const addBtn        = container.querySelector(".tag-add-btn");
    const inputGroup    = container.querySelector(".tag-input-group");
    const input         = container.querySelector(".new-tag-input");
    const saveBtn       = container.querySelector(".tag-save-btn");

    if (!tagsContainer || !addBtn || !inputGroup || !input || !saveBtn) return null;

    function appendTag(tag, checked = true) {
        if (tagsContainer.querySelector(`input[name="tags"][value="${tag.id}"]`)) return;

        const label = document.createElement("label");
        label.className = "tag-item";
        label.innerHTML = `
            <input type="checkbox" name="tags" value="${tag.id}" class="toggle-checkbox"
                ${checked ? "checked" : ""}>
            <span class="tag-button">${tag.name}</span>
        `;
        tagsContainer.appendChild(label);

        if (typeof onChange === "function") onChange(getSelected());
    }

    function getSelected() {
        return [...tagsContainer.querySelectorAll('input[name="tags"]:checked')]
            .map(cb => cb.value);
    }

    function showInput() {
        addBtn.classList.add("hidden");
        inputGroup.classList.remove("hidden");
        input.focus();
    }

    function hideInput() {
        input.value = "";
        inputGroup.classList.add("hidden");
        addBtn.classList.remove("hidden");
    }

    async function save() {
        const text = input.value.trim();
        if (!text) return;

        const originalText = saveBtn.textContent;
        saveBtn.disabled = true;
        saveBtn.textContent = "...";

        try {
            let newTag;
            if (typeof onCreateTag === "function") {
                newTag = await onCreateTag(text);
            } else {
                newTag = { id: `temp_${Date.now()}`, name: text };
            }
            appendTag(newTag, true);
            hideInput();
        } catch (err) {
            console.error("createTag failed:", err);
            alert("Ошибка при создании тега: " + err.message);
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = originalText;
        }
    }

    addBtn.addEventListener("click", showInput);
    saveBtn.addEventListener("click", save);
    input.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            save();
        }
    });

    tagsContainer.addEventListener("change", () => {
        if (typeof onChange === "function") onChange(getSelected());
    });

    return { getSelected, appendTag, showInput, hideInput };
}

import { deleteTag } from "../api/video";

export function initSettingsTagsDelete(token) {
    const deleteBtn = document.getElementById('delete-tags');
    if (!deleteBtn) return;

    deleteBtn.addEventListener('click', async () => {
        const container = document.getElementById('place-tags-settings');
        const checkedBoxes = container.querySelectorAll('input[name="tags"]:checked');
        
        if (checkedBoxes.length === 0) {
            alert('Выберите тэги для удаления');
            return;
        }

        const tagIds = Array.from(checkedBoxes).map(cb => cb.value);
        
        if (!confirm(`Удалить выбранные тэги (${tagIds.length} шт.)?`)) {
            return;
        }

        const originalText = deleteBtn.textContent;
        deleteBtn.textContent = 'Удаление...';
        deleteBtn.disabled = true;

        try {
           
            for (const id of tagIds) {
                await deleteTag(token, id);
            }

            checkedBoxes.forEach(cb => {
                const label = cb.closest('.tag-item');
                if (label) label.remove();
            });
            
        } catch (err) {
            console.error(err);
            alert('Ошибка при удалении: ' + err.message);
        } finally {
            deleteBtn.textContent = originalText;
            deleteBtn.disabled = false;
        }
    });
}