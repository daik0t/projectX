import { deleteTag } from "../api/video";
import { escapeHtml } from "../lib/html";
import { showToast } from "../lib/ui";

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
        const id = String(tag.id);
        const alreadyExists = [...tagsContainer.querySelectorAll('input[name="tags"]')]
            .some((cb) => cb.value === id);
        if (alreadyExists) return;

        const label = document.createElement("label");
        label.className = "tag-item";
        label.innerHTML = `
            <input type="checkbox" name="tags" value="${escapeHtml(id)}" class="toggle-checkbox"
                ${checked ? "checked" : ""}>
            <span class="tag-button">${escapeHtml(tag.name)}</span>
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
            showToast("Ошибка при создании тега: " + err.message, "error");
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = originalText;
        }
    }

    addBtn.addEventListener("click", showInput);
    saveBtn.addEventListener("click", save);
    input.addEventListener("keydown", (e) => {
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

export function initSettingsTagsDelete(token) {
    const deleteBtn = document.getElementById('delete-tags');
    if (!deleteBtn) return;

    deleteBtn.addEventListener('click', async () => {
        const container = document.getElementById('place-tags-settings');
        if (!container) return;

        const checkedBoxes = [...container.querySelectorAll('input[name="tags"]:checked')];
        if (checkedBoxes.length === 0) {
            showToast('Выберите тэги для удаления', 'error');
            return;
        }

        if (!confirm(`Удалить выбранные тэги (${checkedBoxes.length} шт.)?`)) {
            return;
        }

        const originalText = deleteBtn.textContent;
        deleteBtn.textContent = 'Удаление...';
        deleteBtn.disabled = true;

        try {
            const ids = checkedBoxes.map(cb => cb.value);
            const results = await Promise.allSettled(ids.map(id => deleteTag(token, id)));

            results.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    checkedBoxes[index]?.closest('.tag-item')?.remove();
                }
            });

            const failed = results.filter(r => r.status === 'rejected').length;
            if (failed > 0) {
                showToast(`Не удалось удалить тэгов: ${failed}`, 'error');
            } else {
                showToast('Тэги удалены', 'success');
            }
        } catch (err) {
            console.error(err);
            showToast('Ошибка при удалении: ' + err.message, 'error');
        } finally {
            deleteBtn.textContent = originalText;
            deleteBtn.disabled = false;
        }
    });
}
