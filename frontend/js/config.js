const API = '';          // same origin — backend serves frontend statically
const TOKEN_KEY = 'houz_token';
let currentLang = localStorage.getItem('houz_lang_v2') || 'ru';

const i18n = {
  uz: {
    home: "Bosh sahifa",
    allShops: "Barcha do'konlar",
    hammasi: "Hammasi",
    shopsCount: "Dokonlar",
    filter: "Filter",
    searchPlaceholder: "Do'kon, manzil yoki kategoriya izlash...",
    share: "Ulashish",
    directions: "Yo'nalish",
    close: "Yopish",
    notFound: "Do'kon topilmadi",
    searchOther: "Boshqa kalit so'z yoki kategoriya tanlang.",
    descPlaceholder: "Ma'lumot kiritilmagan",
    locPlaceholder: "Bosh ofis joylashuvi kiritilmagan",
    cat: {
      "furniture": "Mebel",
      "lighting": "Yoritish",
      "art-decor": "San’at va dekor",
      "walls": "Devorlar",
      "floor": "Pol",
      "stone": "Tosh",
      "real-estate": "Eksteryer",
      "plants": "O‘simliklar",
      "bathroom": "Vannaxona",
      "other": "Boshqa"
    }
  },
  ru: {
    home: "Главная",
    allShops: "Все магазины",
    hammasi: "Все",
    shopsCount: "Магазины",
    filter: "Фильтр",
    searchPlaceholder: "Поиск магазина, адреса или категории...",
    share: "Поделиться",
    directions: "Маршрут",
    close: "Закрыть",
    notFound: "Магазины не найдены",
    searchOther: "Укажите другое ключевое слово или категорию.",
    descPlaceholder: "Информация не предоставлена",
    locPlaceholder: "Адрес главного офиса не предоставлен",
    cat: {
      "furniture": "Мебель",
      "lighting": "Освещение",
      "art-decor": "Искусство и декор",
      "walls": "Стены",
      "floor": "Пол",
      "stone": "Камень",
      "real-estate": "Экстерьер",
      "plants": "Растения",
      "bathroom": "Ванная комната",
      "other": "Другое"
    }
  }
};

function t(key) {
  return i18n[currentLang]?.[key] || key;
}

function getCatName(slug) {
  return i18n[currentLang]?.cat?.[slug] || slug;
}

function switchLang(lang) {
  currentLang = lang;
  localStorage.setItem('houz_lang_v2', lang);
  location.reload(); 
}

document.addEventListener('DOMContentLoaded', () => {
    const langWrap = document.getElementById('langWrap');
    const langBtn = document.getElementById('langBtn');
    const langDropdown = document.getElementById('langDropdown');
  
    if (langWrap && langBtn && langDropdown) {

        // ── Sync UI to saved language on every page load ──
        const textSpan = langBtn.querySelector('.lang-text');
        if (textSpan) textSpan.textContent = currentLang.toUpperCase();

        const options = langDropdown.querySelectorAll('.lang-option');
        options.forEach(opt => {
            opt.classList.toggle('selected', opt.getAttribute('data-lang') === currentLang);
        });
        // ─────────────────────────────────────────────────

        langBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            langDropdown.classList.toggle('active');
        });
  
        document.addEventListener('click', (e) => {
            if (!langWrap.contains(e.target)) {
                langDropdown.classList.remove('active');
            }
        });
  
        options.forEach(opt => {
            opt.addEventListener('click', () => {
                options.forEach(o => o.classList.remove('selected'));
                opt.classList.add('selected');
                langDropdown.classList.remove('active');
                
                const lang = opt.getAttribute('data-lang');
                if (textSpan) textSpan.textContent = lang.toUpperCase();
                
                switchLang(lang);
            });
        });
    }
});
