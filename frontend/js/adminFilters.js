window.showFiltersView = (categoryId, categoryName) => {
    _currentAdminCategoryId = categoryId;
    document.getElementById('adminCategoryView').style.display = 'none';
    const shopsView = document.getElementById('adminShopsView');
    if(shopsView) shopsView.style.display = 'none';
    
    const filtersView = document.getElementById('adminFiltersView');
    filtersView.style.display = 'block';
    
    document.getElementById('adminFiltersTitle').textContent = `Фильтры: ${categoryName}`;
    
    renderAdminFilters();
};

window.renderAdminFilters = () => {
    const container = document.getElementById('adminFiltersList');
    if (!container || !_currentAdminCategoryId) return;

    let subCats = window._adminSubCategories.filter(sc => String(sc.CategoryId) === String(_currentAdminCategoryId));
    subCats.sort((a,b) => (a.order||0) - (b.order||0));

    if (subCats.length === 0) {
        container.innerHTML = `<div style="text-align:center;color:var(--text3);padding:40px">Дополнительных фильтров пока нет.</div>`;
        return;
    }

    container.innerHTML = subCats.map((sc, index) => `
        <div class="filter-row" style="display: flex; align-items: center; justify-content: space-between; padding: 12px; background: var(--surface); border: 1px solid var(--border); margin-bottom: 8px; border-radius: 8px; transition: 0.2s;">
            <div style="display: flex; align-items: center; gap: 12px;">
                <div style="display: flex; flex-direction: column; gap: 4px;">
                    <button class="btn-icon" onclick="moveFilter(${sc.id}, -1)" ${index === 0 ? 'disabled style="opacity:0.3"' : ''}>⬆️</button>
                    <button class="btn-icon" onclick="moveFilter(${sc.id}, 1)" ${index === subCats.length - 1 ? 'disabled style="opacity:0.3"' : ''}>⬇️</button>
                </div>
                <div style="display: flex; flex-direction: column; justify-content: center;">
                    <span style="font-weight: 500">${escHtml(sc.name)}</span>
                    <span style="font-size: 11px; color: var(--text3)">ID: ${sc.id} • Slug: ${escHtml(sc.slug)}</span>
                </div>
            </div>
            <button class="btn-delete" onclick="deleteFilter(${sc.id}, '${escHtml(sc.name)}')">🗑️ Удалить</button>
        </div>
    `).join('');
};

window.addFilterPrompt = async () => {
    const name = prompt("Введите название фильтра (например: 'Обои'):");
    if (!name || !name.trim()) return;

    const slug = prompt("Введите системный ключ латиницей (например: 'wallpaper'):");
    if (!slug || !slug.trim()) return;

    try {
        const res = await fetch(`${API}/api/subcategories`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem(TOKEN_KEY)}`
            },
            body: JSON.stringify({
                name: name.trim(),
                slug: slug.trim().toLowerCase(),
                CategoryId: _currentAdminCategoryId,
                order: window._adminSubCategories.length // Add to end
            })
        });

        if (handle401(res)) return;
        if (!res.ok) throw new Error('Filter creation failed');
        
        const newCat = await res.json();
        window._adminSubCategories.push(newCat.data);
        showToast('✅ Фильтр добавлен', 'success');
        renderAdminFilters();
    } catch (e) {
        showToast('❌ Ошибка добавления', 'error');
    }
};

window.deleteFilter = async (id, name) => {
    if(!confirm(`Удалить фильтр "${name}"? Связи с магазинами будут разорваны.`)) return;

    try {
        const res = await fetch(`${API}/api/subcategories/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem(TOKEN_KEY)}` }
        });

        if (handle401(res)) return;
        if (!res.ok) throw new Error('Deletion failed');

        window._adminSubCategories = window._adminSubCategories.filter(sc => sc.id !== id);
        showToast('🗑️ Фильтр удален', 'success');
        renderAdminFilters();
    } catch {
        showToast('❌ Ошибка удаления', 'error');
    }
};

window.moveFilter = async (id, direction) => {
    let subCats = window._adminSubCategories.filter(sc => String(sc.CategoryId) === String(_currentAdminCategoryId));
    subCats.sort((a,b) => (a.order||0) - (b.order||0));

    const index = subCats.findIndex(sc => sc.id === id);
    if (index === -1) return;

    if (direction === -1 && index > 0) {
        // Swap up
        const target = subCats[index - 1];
        const tempOrder = subCats[index].order || index;
        subCats[index].order = target.order || (index - 1);
        target.order = tempOrder;
    } else if (direction === 1 && index < subCats.length - 1) {
        // Swap down
        const target = subCats[index + 1];
        const tempOrder = subCats[index].order || index;
        subCats[index].order = target.order || (index + 1);
        target.order = tempOrder;
    } else {
        return; // Boundaries
    }

    renderAdminFilters(); // Optimistic rendering

    // Save to server
    try {
        const payload = subCats.map(sc => ({ id: sc.id, order: sc.order }));
        const res = await fetch(`${API}/api/subcategories/reorder`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem(TOKEN_KEY)}` 
            },
            body: JSON.stringify(payload)
        });
        
        if (handle401(res)) return;
        if (!res.ok) throw new Error('Reorder failed');
    } catch(e) {
        showToast('❌ Ошибка синхронизации порядка', 'error');
    }
};
