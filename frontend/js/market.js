let _allShops = [];
let _activeMainCategory = 'all';
let _activeSubCategory = 'all';
let _liveSubCategories = [];

async function initShopsPage() {
  const params = new URLSearchParams(window.location.search);
  const catSlug = params.get('category') || 'all';
  const catName = catSlug === 'all' ? t('allShops') : getCatName(catSlug);

  _activeMainCategory = catSlug;
  _activeSubCategory = 'all';

  const titleEl = document.getElementById('pageTitle');
  if (titleEl) titleEl.textContent = catName;

  await Promise.all([
    buildCategoryTabs(_activeMainCategory),
    fetchAndRenderShops(_activeMainCategory),
  ]);

  const searchInput = document.getElementById('shopSearch');
  if (searchInput) {
    let timeout = null;
    searchInput.addEventListener('input', () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        fetchAndRenderShops(_activeMainCategory, _activeSubCategory, searchInput.value);
      }, 300);
    });
  }

  document.getElementById('shopModal')?.addEventListener('click', (e) => {
    if (e.target === document.getElementById('shopModal')) closeShopModal();
  });
  document.getElementById('modalClose')?.addEventListener('click', closeShopModal);
  document.getElementById('modalCloseBtn')?.addEventListener('click', closeShopModal);
}

async function buildCategoryTabs(activeMainSlug) {
  const tabsEl = document.getElementById('catTabs');
  if (!tabsEl) return;

  // Let's fetch the dynamic subcategories from our new structured backend
  if (_liveSubCategories.length === 0) {
    try {
        const res = await fetch(`${API}/api/subcategories`);
        const json = await res.json();
        _liveSubCategories = json.data;
    } catch (e) {
        console.error("Could not fetch dynamic subcategories", e);
    }
  }

  // Filter subcategories for this specific main category slug
  const mainCategoryIdObj = window._adminCategories ? window._adminCategories.find(c => c.slug === activeMainSlug) : null;
  
  let subCats = [];
  if (mainCategoryIdObj) {
      subCats = _liveSubCategories.filter(sc => String(sc.CategoryId) === String(mainCategoryIdObj.id));
  } else {
      // Fallback to static if backend isn't loaded completely
      subCats = subCategoriesData[activeMainSlug] || [];
  }

  if (subCats.length === 0) {
      tabsEl.parentNode.style.display = 'none';
      return;
  } else {
      tabsEl.parentNode.style.display = 'flex';
  }

  const allTabs = [{ name: t('hammasi'), nameRu: t('hammasi'), slug: 'all', id: 'all' }, ...subCats];

  tabsEl.innerHTML = allTabs.map(cat => {
    const displayName = currentLang === 'ru' && cat.name_ru ? cat.name_ru : (cat.name || cat.name_ru);
    return `
    <button class="cat-pill ${cat.slug === _activeSubCategory || String(cat.id) === _activeSubCategory ? 'active' : ''}"
            data-slug="${escHtml(cat.slug)}"
            data-id="${cat.id || cat.slug}"
            data-name="${escHtml(displayName)}">
      ${escHtml(displayName)}
    </button>
  `}).join('');

  tabsEl.querySelectorAll('.cat-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      tabsEl.querySelectorAll('.cat-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      _activeSubCategory = btn.dataset.id; // use ID for filtering backend dynamically
      
      const searchVal = document.getElementById('shopSearch')?.value || '';
      // We pass the actual Main DB Category ID instead of slug to backend
      const mCat = window._adminCategories ? window._adminCategories.find(c => c.slug === _activeMainCategory) : null;
      fetchAndRenderShops(mCat ? mCat.id : _activeMainCategory, _activeSubCategory, searchVal);
    });
  });
}

async function fetchAndRenderShops(activeMainIdOrSlug = 'all', activeSubIdOrSlug = 'all', searchVal = '') {
  const grid = document.getElementById('shopsGrid');
  if (!grid) return;

  grid.innerHTML = Array(6).fill().map(() => `
    <div class="skeleton-card">
      <div class="skeleton-logo"></div>
      <div class="skeleton-info">
        <div class="skeleton-line"></div>
        <div class="skeleton-line short"></div>
      </div>
    </div>
  `).join('');

  try {
    let url = `${API}/api/shops`;
    const params = new URLSearchParams();
    
    let resolvedMainId = activeMainIdOrSlug;
    if (resolvedMainId && resolvedMainId !== 'all' && isNaN(resolvedMainId)) {
        const mCat = window._adminCategories ? window._adminCategories.find(c => c.slug === resolvedMainId) : null;
        if (mCat) resolvedMainId = mCat.id;
    }

    if (resolvedMainId && resolvedMainId !== 'all') params.append('category', resolvedMainId);
    if (activeSubIdOrSlug && activeSubIdOrSlug !== 'all') params.append('subcategory', activeSubIdOrSlug);
    if (searchVal) params.append('search', searchVal);
    
    const queryStr = params.toString();
    if (queryStr) url += `?${queryStr}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error('API error');
    const json = await res.json();
    _allShops = json.data || json || [];
  } catch (err) {
      console.error(err);
      _allShops = [];
  }

  // Frontend manual filter since backend filtering of Many-to-Many is tricky in basic query
  // Ensures subcategory accurate filtering
  let displayShops = _allShops;
  if (activeSubIdOrSlug && activeSubIdOrSlug !== 'all') {
      displayShops = displayShops.filter(s => {
          if (!s.SubCategories) return false;
          return s.SubCategories.some(sc => String(sc.id) === String(activeSubIdOrSlug));
      });
  }

  renderShops(displayShops);

  const urlParams = new URLSearchParams(window.location.search);
  const shopIdParam = urlParams.get('shop');
  
  if (shopIdParam && !window._shopModalOpened) {
      window._shopModalOpened = true; 
      setTimeout(() => openShopModal(parseInt(shopIdParam)), 100);
  }
}

function renderShops(shops) {
  const grid = document.getElementById('shopsGrid');
  const countEl = document.getElementById('shopCount');
  const pageCountEl = document.getElementById('pageCount');
  if (!grid) return;

  if (countEl) countEl.textContent = `${t('shopsCount')} ${shops.length}`;
  if (pageCountEl) pageCountEl.textContent = `${shops.length} ta`;

  const filterBtn = document.querySelector('.btn-outline-small.btn-filter');
  if(filterBtn) filterBtn.innerHTML = `${t('filter')} <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>`;

  if (shops.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔍</div>
        <h3>${t('notFound')}</h3>
        <p>${t('searchOther')}</p>
      </div>`;
    return;
  }

  grid.innerHTML = shops.map((shop, i) => {
    return `
    <div class="market-card" style="animation-delay:${i * 0.05}s"
         onclick="openShopModal(${shop.id})" role="button" tabindex="0"
         onkeydown="if(event.key==='Enter')openShopModal(${shop.id})">
      
      <div class="market-logo-box">
        ${logoFallback(shop.logoUrl, shop.name)}
      </div>

      <div class="market-info">
        <div class="market-name">${escHtml(shop.name)}</div>
        <div class="market-desc">${escHtml(shop.description || 'Klassik va zamonaviy uslubdagi sifatli mebellar...')}</div>
      </div>

      <div class="market-chevron">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>

    </div>`;
  }).join('');
}

document.addEventListener('DOMContentLoaded', async () => {
    // Need to pre-fetch categories globally so market tabs can match name to ID correctly
    try {
        const catsRes = await fetch(`${API}/api/categories`);
        window._adminCategories = (await catsRes.json()).data || [];
    } catch(e) {}
    
    const path = window.location.pathname;
    const page = path.split('/').pop() || 'index.html';
    if (page === 'shops.html') {
        initShopsPage();
    }
});
