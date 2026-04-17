/**
 * Main Application Logic
 * Fetches data, generates UI, IntersectionObserver tracking, and Localization
 */

let currentLang = 'ar';
let menuDataCache = null;

const staticStrings = {
    'ar': {
        'site-title': 'مطعم أبو هيثم',
        'site-slogan': 'أصل التسوية والمذاق الأصيل',
        'footer-title': 'مطعم أبو هيثم',
        'footer-address': 'العنوان:',
        'footer-address-val': '74 شارع مجلس الشعب – السيدة زينب',
        'btn-map-text': '📍 الاتجاهات على الخريطة',
        'footer-contact': 'للتواصل والطلبات:',
        'footer-note': 'جودة وطعم يتحدى الجميع',
        'btn-review-text': 'مراجعة الطلب',
        'btn-checkout-text': 'تأكيد الطلب واتساب',
        'modal-cart-title': 'سلة طلباتك',
        'add-button': '+ أضف الطلب',
        'currency': 'ج',
        'loading': 'جاري تحميل أشهى الأطباق...',
        'error_title': 'عذراً، المنيو غير متاح حالياً',
        'error_desc': 'حدث خطأ أثناء تحميل البيانات أو أن نظام الطلبات تحت الصيانة.',
        'retry': 'حاول مرة أخرى'
    },
    'en': {
        'site-title': 'Abu Haitham',
        'site-slogan': 'The Original Taste of Sayeda Zeinab',
        'footer-title': 'Abu Haitham Restaurant',
        'footer-address': 'Address:',
        'footer-address-val': '74 Magles El Shaab St - Sayeda Zeinab',
        'btn-map-text': '📍 Get Directions',
        'footer-contact': 'Contact & Orders:',
        'footer-note': 'Quality and Taste that defies everyone',
        'btn-review-text': 'Review Order',
        'btn-checkout-text': 'Confirm Order (WhatsApp)',
        'modal-cart-title': 'Your Cart',
        'add-button': '+ Add to Cart',
        'currency': 'EGP',
        'loading': 'Loading delicious dishes...',
        'error_title': 'Sorry, the menu is currently unavailable',
        'error_desc': 'An error occurred while loading data or the system is under maintenance.',
        'retry': 'Try Again'
    }
};

document.addEventListener('DOMContentLoaded', () => {
    // Check saved language
    const savedLang = localStorage.getItem('siteLang');
    if (savedLang === 'en') {
        currentLang = 'en';
        applyStaticTranslations();
    }
    fetchMenuData();
});

function toggleLanguage() {
    currentLang = currentLang === 'ar' ? 'en' : 'ar';
    localStorage.setItem('siteLang', currentLang);
    applyStaticTranslations();
    
    // Re-render menu using cached data to apply JSON translations
    if (menuDataCache) {
        generateNavigation(menuDataCache.categories);
        generateMenu(menuDataCache.categories, menuDataCache.global_addons || []);
        setupStickyNavHighlighting();
    }
    
    if (typeof updateCartUI === 'function') {
        updateCartUI(); // Update texts in cart
    }
}

function applyStaticTranslations() {
    document.documentElement.lang = currentLang;
    document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
    document.getElementById('btn-lang').innerText = currentLang === 'ar' ? 'EN' : 'AR';
    
    const tryUpdate = (id, key) => {
        const el = document.getElementById(id);
        if (el) el.innerText = staticStrings[currentLang][key];
    };

    tryUpdate('site-title', 'site-title');
    tryUpdate('site-slogan', 'site-slogan');
    tryUpdate('footer-title', 'footer-title');
    tryUpdate('footer-address', 'footer-address');
    tryUpdate('footer-address-val', 'footer-address-val');
    tryUpdate('btn-map-text', 'btn-map-text');
    tryUpdate('footer-contact', 'footer-contact');
    tryUpdate('footer-note', 'footer-note');
    tryUpdate('btn-review-text', 'btn-review-text');
    tryUpdate('btn-checkout-text', 'btn-checkout-text');
    tryUpdate('modal-cart-title', 'modal-cart-title');
}

function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return str.toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function getLocalizedStr(item, baseKey) {
     if (currentLang === 'en' && item[baseKey + '_en']) {
         return item[baseKey + '_en'];
     }
     return item[baseKey] || '';
}

async function fetchMenuData() {
    try {
        const response = await fetch(`menu.json`);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        
        if (!data || !data.categories || !Array.isArray(data.categories)) {
            throw new Error('بنية المنيو غير صالحة أو معطوبة');
        }
        
        menuDataCache = data;
        generateNavigation(data.categories);
        generateMenu(data.categories, data.global_addons || []);
        setupStickyNavHighlighting();

        if (typeof window.dataLayer !== 'undefined') {
            window.dataLayer.push({ 'event': 'MenuLoaded' });
        }
    } catch (error) {
        console.error('Failed to load menu:', error);
        document.getElementById('menu-container').innerHTML = `
            <div style="text-align: center; padding: 3rem 1rem; color: var(--primary); background: var(--light); border-radius: var(--radius); margin: 2rem; box-shadow: var(--shadow);">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 1rem;"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                <h3 style="margin-bottom: 0.5rem;">${staticStrings[currentLang].error_title}</h3>
                <p style="color: #666; margin-bottom: 1.5rem;">${staticStrings[currentLang].error_desc}</p>
                <button onclick="location.reload()" style="padding: 0.75rem 1.5rem; background: var(--secondary); border: none; font-weight: bold; border-radius: 20px; cursor: pointer; color: var(--dark);">${staticStrings[currentLang].retry}</button>
            </div>
        `;
    }
}

function generateNavigation(categories) {
    const nav = document.getElementById('category-nav');
    nav.innerHTML = '';

    categories.forEach((cat, index) => {
        const link = document.createElement('a');
        link.href = `#sec-${cat.id}`;
        link.className = `nav-link ${index === 0 ? 'active' : ''}`;
        link.innerText = getLocalizedStr(cat, 'name');
        
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            const offsetTop = targetSection.getBoundingClientRect().top + window.scrollY - 70;
            
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
            
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });

        nav.appendChild(link);
    });
}

function generateMenu(categories, addons) {
    const container = document.getElementById('menu-container');
    container.innerHTML = '';

    categories.forEach(cat => {
        const section = document.createElement('section');
        section.id = `sec-${escapeHTML(cat.id)}`;
        section.className = 'category-section';

        const catName = getLocalizedStr(cat, 'name');
        const catNote = getLocalizedStr(cat, 'note');

        let sectionHTML = `<h2 class="category-title">${escapeHTML(catName)}</h2>`;
        if (catNote) {
            sectionHTML += `<span class="category-note">${escapeHTML(catNote)}</span>`;
        }

        sectionHTML += `<div class="menu-grid">`;

        const sortedItems = [...cat.items].sort((a, b) => {
            if (a.highlight && !b.highlight) return -1;
            if (!a.highlight && b.highlight) return 1;
            return 0;
        });

        const showAddons = (cat.id === 'sandwiches' || cat.id === 'meals');

        sortedItems.forEach(item => {
            const eId = escapeHTML(item.id);
            const itemName = getLocalizedStr(item, 'name');
            const eName = escapeHTML(itemName);
            const eImage = escapeHTML(item.image);
            const itemDesc = getLocalizedStr(item, 'description');
            const itemBadge = getLocalizedStr(item, 'badge');
            
            sectionHTML += `
            <div class="menu-card" data-id="${eId}">
                ${itemBadge ? `<span class="badge">${escapeHTML(itemBadge)}</span>` : ''}
                
                <div class="img-wrapper">
                    <img src="${eImage}" alt="${eName}" class="menu-img" loading="lazy" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\\'http://www.w3.org/2000/svg\\\' width=\\\'100%\\\' height=\\\'100%\\\'><rect width=\\\'100%\\\' height=\\\'100%\\\' fill=\\\'#eee\\\'/><text x=\\\'50%\\\' y=\\\'50%\\\' font-family=\\\'sans-serif\\\' font-size=\\\'14\\\' text-anchor=\\\'middle\\\' alignment-baseline=\\\'middle\\\' fill=\\\'#999\\\'>صورة غير متوفرة</text></svg>'">
                </div>
                
                <div class="card-content">
                    <h3 class="card-title">${eName}</h3>
                    ${itemDesc ? `<p class="card-desc">${escapeHTML(itemDesc)}</p>` : ''}
                    
                    <div class="price-row">
                        ${generatePriceElement(item)}
                    </div>

                    ${showAddons ? generateAddonsHTML(item, addons) : ''}

                    <button class="btn-add" aria-label="${eName}" onclick="addToCart('${eId}', '${eName}', ${item.price || 0})">
                        ${staticStrings[currentLang]['add-button']}
                    </button>
                </div>
            </div>`;
        });

        sectionHTML += `</div>`;
        section.innerHTML = sectionHTML;
        container.appendChild(section);
    });
}

function generateAddonsHTML(item, addons) {
    if (!addons || addons.length === 0) return '';
    let html = '<div class="quick-addons">';
    addons.forEach(addon => {
        const addonName = getLocalizedStr(addon, 'name');
        html += `
        <label class="addon-label">
            <input type="checkbox" class="addon-checkbox" data-for="${escapeHTML(item.id)}" data-name="${escapeHTML(addonName)}" data-price="${escapeHTML(addon.price)}">
            ${escapeHTML(addonName)} <span class="addon-price">(+${escapeHTML(addon.price)})</span>
        </label>`;
    });
    html += '</div>';
    return html;
}

function generatePriceElement(item) {
    const currency = staticStrings[currentLang].currency;
    if (item.variants && item.variants.length > 0) {
        let selectHTML = `<select class="variants-select" data-for="${escapeHTML(item.id)}" onchange="updateDisplayedPrice(this, '${escapeHTML(item.id)}')">`;
        item.variants.forEach((v, idx) => {
            const sizeName = getLocalizedStr(v, 'size');
            selectHTML += `<option value="${idx}" data-price="${escapeHTML(v.price)}" data-size="${escapeHTML(sizeName)}">${escapeHTML(sizeName)} - ${escapeHTML(v.price)} ${currency}</option>`;
        });
        selectHTML += `</select>`;
        
        return `
            <span class="price-value" id="price-display-${escapeHTML(item.id)}">${escapeHTML(item.variants[0].price)} ${currency}</span>
            ${selectHTML}
        `;
    } else {
        return `<span class="price-value" id="price-display-${escapeHTML(item.id)}">${escapeHTML(item.price)} ${currency}</span>`;
    }
}

window.updateDisplayedPrice = function(selectElement, itemId) {
    const currency = staticStrings[currentLang].currency;
    const selectedOption = selectElement.options[selectElement.selectedIndex];
    const newPrice = selectedOption.dataset.price;
    document.getElementById(`price-display-${itemId}`).innerText = `${newPrice} ${currency}`;
}

// FIX: Anti-Lag scroll listener using IntersectionObserver
function setupStickyNavHighlighting() {
    const sections = document.querySelectorAll('.category-section');
    const navLinks = document.querySelectorAll('.nav-link');

    // Create an observer
    const observerOptions = {
        root: null,
        rootMargin: '-80px 0px -60% 0px', // Triggers when section is near top
        threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const currentId = entry.target.getAttribute('id');
                
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${currentId}`) {
                        link.classList.add('active');
                        // Scroll nav on mobile smoothly
                        link.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
                    }
                });
            }
        });
    }, observerOptions);

    sections.forEach(section => {
        observer.observe(section);
    });
}
