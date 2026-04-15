async function initIndexPage() {
    await Promise.all([
      loadCategoriesHome(),
      loadTotalShopCount(),
    ]);
}
  
async function loadCategoriesHome() {
  const grid = document.getElementById('homeGrid');
    if (!grid) return;
  
    // Show skeleton loader first
    grid.innerHTML = Array(10).fill().map(() => `
      <div class="skeleton-home-card">
        <div class="skeleton-home-icon"></div>
        <div class="skeleton-home-text"></div>
      </div>
    `).join('');

    // Category images — update these URLs after running backend/uploadCategoryImages.js
    const categoryImages = {
      'furniture':   'img/Furniture.png',
      'lighting':    'img/Lighting.png',
      'art-decor':   'img/Art & Decor.png',
      'walls':       'img/Walls.png',
      'floor':       'img/Floor.png',
      'stone':       'img/Stone.png',
      'real-estate': 'img/Real Estate.png',
      'plants':      'img/Plants.png',
      'bathroom':    'img/Bathroom.png',
      'other':       'img/Other.png',
    };

    const categories = [
      { name: 'Furniture',    slug: 'furniture',    image: categoryImages['furniture'] },
      { name: 'Lighting',     slug: 'lighting',     image: categoryImages['lighting'] },
      { name: 'Art & Decor',  slug: 'art-decor',    image: categoryImages['art-decor'] },
      { name: 'Walls',        slug: 'walls',        image: categoryImages['walls'] },
      { name: 'Floor',        slug: 'floor',        image: categoryImages['floor'] },
      { name: 'Stone',        slug: 'stone',        image: categoryImages['stone'] },
      { name: 'Real Estate',  slug: 'real-estate',  image: categoryImages['real-estate'] },
      { name: 'Plants',       slug: 'plants',       image: categoryImages['plants'] },
      { name: 'Bathroom',     slug: 'bathroom',     image: categoryImages['bathroom'] },
      { name: 'Other',        slug: 'other',        image: categoryImages['other'] },
    ];
  
    // Preload all images before showing
    await Promise.all(categories.map(cat => new Promise(resolve => {
        const img = new Image();
        img.onload = resolve;
        img.onerror = resolve;
        img.src = cat.image;
    })));

    grid.innerHTML = categories.map(cat => `
      <a href="shops.html?category=${encodeURIComponent(cat.slug)}&name=${encodeURIComponent(getCatName(cat.slug))}"
         class="home-card home-card-hidden">
        <img src="${cat.image}" alt="${escHtml(getCatName(cat.slug))}" class="home-card-img">
        <span class="home-card-label">${escHtml(getCatName(cat.slug))}</span>
      </a>
    `).join('');

    // Trigger fade-in on next frame so transition fires
    requestAnimationFrame(() => {
        grid.querySelectorAll('.home-card-hidden').forEach(el => el.classList.remove('home-card-hidden'));
    });
    
    // Update header badge if present
    const countBadge = document.getElementById('shopCountBadge');
    if (countBadge) countBadge.style.display = 'none'; // Hide badge on minimal home
}
  
async function loadTotalShopCount() {
    const badge = document.getElementById('totalShops');
    if (!badge) return;
    try {
      const res = await fetch(`${API}/api/shops`);
      if (!res.ok) return;
      const json = await res.json();
      badge.textContent = json.data.length;
    } catch { /* keep dash */ }
}

document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;
    const page = path.split('/').pop() || 'index.html';
    if (page === 'index.html' || page === '' || page === '/') {
        initIndexPage();
    }
});
