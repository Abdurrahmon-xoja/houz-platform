function openShopModal(shopId) {
    const shop = _allShops.find(s => s.id === shopId);
    if (!shop) return;
  
    // Logo
    document.getElementById('modalLogo').innerHTML = logoFallback(shop.logoUrl, shop.name);
  
    // Info Column
    document.getElementById('modalName').textContent = shop.name;
  
    const desc = currentLang === 'ru' ? (shop.description_ru || shop.description) : shop.description;
    document.getElementById('modalDescFull').textContent = desc || t('descPlaceholder');
  
    const loc = shop.location || t('locPlaceholder');
    document.getElementById('modalLocText').textContent = shop.location || t('locPlaceholder');
  
    // Rows
    const rows = [];
    if (shop.locationLink) {
      const shortLink = shop.locationLink.includes('maps.google') ? 'Google Maps' : (shop.locationLink.includes('yandex') ? 'Yandex Maps' : 'Xarita/Map');
      rows.push(`<div class="modal-row" onclick="goExternal('${escHtml(shop.locationLink)}')" style="cursor:pointer">
        <span class="modal-row-svg" style="font-size: 18px">📍</span>
        <span class="modal-row-text" style="color:var(--accent); text-decoration:underline">${shortLink}</span>
      </div>`);
    }
    if (shop.instagram) {
      const handle = shop.instagram.split('/').pop().replace('?','');
      rows.push(`<div class="modal-row" onclick="goExternal('${escHtml(shop.instagram)}')" style="cursor:pointer">
        <img src="img/icons/instgram%20.svg" class="modal-row-svg" alt="IG">
        <span class="modal-row-text">@${escHtml(handle)}</span>
      </div>`);
    }
    if (shop.telegram) {
      const handle = shop.telegram.split('/').pop();
      rows.push(`<div class="modal-row" onclick="goExternal('${escHtml(shop.telegram)}')" style="cursor:pointer">
        <img src="img/icons/Telegram%20.svg" class="modal-row-svg" alt="TG">
        <span class="modal-row-text">@${escHtml(handle)}</span>
      </div>`);
    }
    if (shop.customLinks) {
      try {
        const links = JSON.parse(shop.customLinks);
        links.forEach(link => {
          rows.push(`<div class="modal-row" onclick="goExternal('${escHtml(link.url)}')" style="cursor:pointer">
            <svg class="modal-row-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="2" y1="12" x2="22" y2="12"></line>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
            </svg>
            <span class="modal-row-text">${escHtml(link.label)}</span>
          </div>`);
        });
      } catch(e) { console.error('Error parsing custom links for modal', e); }
    }
    if (shop.website) {
      const host = new URL(shop.website).hostname.replace('www.','');
      rows.push(`<div class="modal-row" onclick="goExternal('${escHtml(shop.website)}')" style="cursor:pointer">
        <img src="img/icons/WebsitegoArrow%20Icon.svg" class="modal-row-svg" alt="Web">
        <span class="modal-row-text">www.${escHtml(host)}</span>
      </div>`);
    }
    if (shop.phone) {
      rows.push(`<a href="tel:${escHtml(shop.phone)}" class="modal-row">
        <img src="img/icons/phone%20icon.svg" class="modal-row-svg" alt="Phone">
        <span class="modal-row-text">${escHtml(shop.phone)}</span>
      </a>`);
    }
  
    document.getElementById('modalRows').innerHTML = rows.join('');
  
    // Primary buttons
    const shareBtn = document.getElementById('modalShareBtn');
    const dirBtn = document.getElementById('modalDirectionsBtn');
  
    if (shareBtn) {
      // Keep icon but update text
      shareBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
            <polyline points="16 6 12 2 8 6"></polyline>
            <line x1="12" y1="2" x2="12" y2="15"></line>
        </svg>
        ${t('share')}
      `;
      shareBtn.onclick = async () => {
        const shareCat = shop.Category && shop.Category.slug ? shop.Category.slug : _activeMainCategory;
        const shareUrl = `${window.location.origin}${window.location.pathname}?category=${shareCat}&shop=${shop.id}`;
        
        try {
          await navigator.clipboard.writeText(shareUrl);
          showToast(currentLang === 'ru' ? 'Ссылка скопирована' : 'Havola nusxalandi', 'success');
        } catch (err) {
          showToast('Xatolik yuz berdi', 'error');
        }
      };
    }
  
    if (dirBtn) {
      dirBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
        </svg>
        ${t('directions')}
      `;
      // Decide which link to open, locationLink > location string search > nothing
      dirBtn.onclick = () => {
        if (shop.locationLink) {
          goExternal(shop.locationLink);
        } else if (shop.location) {
          goExternal(`https://maps.google.com/?q=${encodeURIComponent(shop.location)}`);
        } else {
          showToast(currentLang === 'ru' ? 'Маршрут не найден' : "Manzil kiritilmagan", 'error');
        }
      };
    }
  
    const overlay = document.getElementById('shopModal');
    if (overlay) {
        overlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}
  
function closeShopModal() {
    const overlay = document.getElementById('shopModal');
    if (overlay) overlay.style.display = 'none';
    document.body.style.overflow = '';
}
  
// Close with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeShopModal();
      if (typeof closeShopForm === 'function') closeShopForm();
    }
});
