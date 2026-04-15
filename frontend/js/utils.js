function showToast(msg, type = 'info') {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.className = `toast show ${type}`;
    clearTimeout(t._tid);
    t._tid = setTimeout(() => { t.className = 'toast'; }, 2800);
}
  
function escHtml(str) {
return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function cloudinaryOptimize(url) {
    if (!url || !url.includes('res.cloudinary.com')) return url;
    return url.replace('/upload/', '/upload/q_auto,f_auto,w_400/');
}

function logoFallback(logoUrl, name) {
if (logoUrl) {
    const optimizedUrl = cloudinaryOptimize(logoUrl);
    return `<img src="${escHtml(optimizedUrl)}" alt="${escHtml(name)}"
            onerror="this.replaceWith(document.createTextNode('🏪'))">`;
}
const letter = (name || '?').charAt(0).toUpperCase();
return `<span style="font-size:22px;font-weight:800;color:var(--accent)">${letter}</span>`;
}

function goExternal(url) {
    if (url) window.open(url, '_blank', 'noopener noreferrer');
}
