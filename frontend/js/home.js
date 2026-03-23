async function initIndexPage() {
    await Promise.all([
      loadCategoriesHome(),
      loadTotalShopCount(),
    ]);
}
  
async function loadCategoriesHome() {
    const grid = document.getElementById('homeGrid');
    if (!grid) return;
  
    const categories = [
      { name: 'Furniture',    slug: 'furniture',    image: 'img/Furniture.png' },
      { name: 'Lighting',     slug: 'lighting',     image: 'img/Lighting.png' },
      { name: 'Art & Decor',  slug: 'art-decor',    image: 'img/Art & Decor.png' },
      { name: 'Walls',        slug: 'walls',        image: 'img/Walls.png' },
      { name: 'Floor',        slug: 'floor',        image: 'img/Floor.png' },
      { name: 'Stone',        slug: 'stone',        image: 'img/Stone.png' },
      { name: 'Real Estate',  slug: 'real-estate',  image: 'img/Real Estate.png' },
      { name: 'Plants',       slug: 'plants',       image: 'img/Plants.png' },
      { name: 'Bathroom',     slug: 'bathroom',     image: 'img/Bathroom.png' },
      { name: 'Other',        slug: 'other',        image: 'img/Other.png' },
    ];
  
    grid.innerHTML = categories.map((cat, i) => `
      <a href="shops.html?category=${encodeURIComponent(cat.slug)}&name=${encodeURIComponent(getCatName(cat.slug))}"
         class="home-card"
         style="animation-delay:${i * 0.05}s">
        <img src="${cat.image}" alt="${escHtml(getCatName(cat.slug))}" class="home-card-img"loading="lazy">
        <span class="home-card-label">${escHtml(getCatName(cat.slug))}</span>
      </a>
    `).join('');
    
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
