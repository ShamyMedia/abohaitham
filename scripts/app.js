/**
 * Main Application Logic
 * Fetches data, generates UI, and handles Sticky Nav
 */

document.addEventListener('DOMContentLoaded', () => {
    fetchMenuData();
});

function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return str.toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

async function fetchMenuData() {
    try {
        // Using pure URL to respect Service Worker's Network-First strategy
        // This prevents cache pollution / memory leaks from unique query params
        const response = await fetch(`menu.json`);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        
        // --- DATA VALIDATION GUARD ---
        if (!data || !data.categories || !Array.isArray(data.categories)) {
            throw new Error('بنية المنيو غير صالحة أو معطوبة');
        }
        
        generateNavigation(data.categories);
        generateMenu(data.categories, data.global_addons || []);
        setupStickyNavHighlighting();

        // --- EVENT TRACKING: PageView / MenuLoaded ---
        if (typeof window.dataLayer !== 'undefined') {
            window.dataLayer.push({ 'event': 'MenuLoaded' });
        }
        console.log("Tracking Event Logged: MenuLoaded");
    } catch (error) {
        console.error('Failed to load menu:', error);
        document.getElementById('menu-container').innerHTML = `
            <div style="text-align: center; padding: 3rem 1rem; color: var(--primary); background: var(--light); border-radius: var(--radius); margin: 2rem; box-shadow: var(--shadow);">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 1rem;"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                <h3 style="margin-bottom: 0.5rem;">عذراً، المنيو غير متاح حالياً</h3>
                <p style="color: #666; margin-bottom: 1.5rem;">حدث خطأ أثناء تحميل البيانات أو أن نظام الطلبات تحت الصيانة.</p>
                <button onclick="location.reload()" style="padding: 0.75rem 1.5rem; background: var(--secondary); border: none; font-weight: bold; border-radius: 20px; cursor: pointer; color: var(--dark);">حاول مرة أخرى</button>
            </div>
        `;
    }
}

function generateNavigation(categories) {
    const nav = document.getElementById('category-nav');
    nav.innerHTML = ''; // Selectively clear the nav

    categories.forEach((cat, index) => {
        const link = document.createElement('a');
        link.href = `#sec-${cat.id}`;
        link.className = `nav-link ${index === 0 ? 'active' : ''}`;
        link.innerText = cat.name;
        
        // Smooth scroll handling
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            // Offset for sticky nav height (~60px)
            const offsetTop = targetSection.getBoundingClientRect().top + window.scrollY - 70;
            
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
            
            // Update active state manually on click
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });

        nav.appendChild(link);
    });
}

function generateMenu(categories, addons) {
    const container = document.getElementById('menu-container');
    container.innerHTML = ''; // Clear loading text

    categories.forEach(cat => {
        const section = document.createElement('section');
        section.id = `sec-${escapeHTML(cat.id)}`;
        section.className = 'category-section';

        let sectionHTML = `<h2 class="category-title">${escapeHTML(cat.name)}</h2>`;
        if (cat.note) {
            sectionHTML += `<span class="category-note">${escapeHTML(cat.note)}</span>`;
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
            const eName = escapeHTML(item.name);
            const ePrice = escapeHTML(item.price);
            const eImage = escapeHTML(item.image);
            
            sectionHTML += `
            <div class="menu-card" data-id="${eId}">
                ${item.badge ? `<span class="badge">${escapeHTML(item.badge)}</span>` : ''}
                
                <div class="img-wrapper">
                    <img src="${eImage}" alt="${eName}" class="menu-img" loading="lazy" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\\'http://www.w3.org/2000/svg\\\' width=\\\'100%\\\' height=\\\'100%\\\'><rect width=\\\'100%\\\' height=\\\'100%\\\' fill=\\\'#eee\\\'/><text x=\\\'50%\\\' y=\\\'50%\\\' font-family=\\\'sans-serif\\\' font-size=\\\'14\\\' text-anchor=\\\'middle\\\' alignment-baseline=\\\'middle\\\' fill=\\\'#999\\\'>صورة غير متوفرة</text></svg>'">
                </div>
                
                <div class="card-content">
                    <h3 class="card-title">${eName}</h3>
                    ${item.description ? `<p class="card-desc">${escapeHTML(item.description)}</p>` : ''}
                    
                    <div class="price-row">
                        ${generatePriceElement(item)}
                    </div>

                    ${showAddons ? generateAddonsHTML(item, addons) : ''}

                    <button class="btn-add" aria-label="أضف ${eName} للسلة" onclick="addToCart('${eId}', '${eName}', ${item.price || 0})">
                        + أضف الطلب
                    </button>
                </div>
            </div>`;
        });

        sectionHTML += `</div>`; // Close menu-grid
        section.innerHTML = sectionHTML;
        container.appendChild(section);
    });
}

function generateAddonsHTML(item, addons) {
    if (!addons || addons.length === 0) return '';
    let html = '<div class="quick-addons">';
    addons.forEach(addon => {
        html += `
        <label class="addon-label">
            <input type="checkbox" class="addon-checkbox" data-for="${escapeHTML(item.id)}" data-name="${escapeHTML(addon.name)}" data-price="${escapeHTML(addon.price)}">
            ${escapeHTML(addon.name)} <span class="addon-price">(+${escapeHTML(addon.price)})</span>
        </label>`;
    });
    html += '</div>';
    return html;
}

function generatePriceElement(item) {
    if (item.variants && item.variants.length > 0) {
        let selectHTML = `<select class="variants-select" data-for="${escapeHTML(item.id)}" onchange="updateDisplayedPrice(this, '${escapeHTML(item.id)}')">`;
        item.variants.forEach((v, idx) => {
            selectHTML += `<option value="${idx}" data-price="${escapeHTML(v.price)}" data-size="${escapeHTML(v.size)}">${escapeHTML(v.size)} - ${escapeHTML(v.price)} ج</option>`;
        });
        selectHTML += `</select>`;
        
        // Display initially the price of the first variant
        return `
            <span class="price-value" id="price-display-${escapeHTML(item.id)}">${escapeHTML(item.variants[0].price)} ج</span>
            ${selectHTML}
        `;
    } else {
        return `<span class="price-value" id="price-display-${escapeHTML(item.id)}">${escapeHTML(item.price)} ج</span>`;
    }
}

// Global function to update price when variant changes
window.updateDisplayedPrice = function(selectElement, itemId) {
    const selectedOption = selectElement.options[selectElement.selectedIndex];
    const newPrice = selectedOption.dataset.price;
    document.getElementById(`price-display-${itemId}`).innerText = `${newPrice} ج`;
}

function setupStickyNavHighlighting() {
    const sections = document.querySelectorAll('.category-section');
    const navLinks = document.querySelectorAll('.nav-link');

    window.addEventListener('scroll', () => {
        let current = '';

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            // Subtract navbar height + some buffer
            if (scrollY >= (sectionTop - 80)) { 
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
                
                // Optional: scroll nav to keep active item in view on mobile
                const nav = document.getElementById('category-nav');
                const linkRect = link.getBoundingClientRect();
                const navRect = nav.getBoundingClientRect();
                
                if (linkRect.left < navRect.left || linkRect.right > navRect.right) {
                    link.scrollIntoView({ behavior: "smooth", inline: "center" });
                }
            }
        });
    });
}
