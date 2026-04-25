let currentLang = "ar";
let menuDataCache = null;

function getEl(id) { return document.getElementById(id); }

window.getMenuNode = function(baseId) {
    if (!menuDataCache || !menuDataCache.categories) return null;
    for (const cat of menuDataCache.categories) {
        if (!cat.items) continue;
        const item = cat.items.find(i => i.id === baseId);
        if (item) return item;
    }
    return null;
};

/* ========================= نصوص الواجهة ========================= */
const UI_TEXT = {
    ar: {
        loading:       "جاري التحميل...",
        error:         "تعذّر تحميل المنيو. تحقق من الاتصال وأعد المحاولة.",
        retry:         "إعادة المحاولة",
        chooseSize:    "اختار الحجم",
        addons:        "إضافات (اختياري)",
        chooseSizeAlert: "اختار الحجم أولاً",
        addToCart:     "إضافة للسلة",
        selectBtn:     "اطلب الآن",
        cartTitle:     "السلة",
        cartEmpty:     "السلة فارغة",
        checkout:      "تأكيد الطلب عبر واتساب 📲",
        currency:      "",
        from:          "من",
        total:         "الإجمالي",
        siteTitle:     "مطعم أبو هيثم",
        siteSlogan:    "أصل التسوية والمذاق الأصيل",
        footerTitle:   "مطعم أبو هيثم",
        footerSlogan:  "أصل التسوية والمذاق الأصيل",
        mapText:       "الموقع على الخريطة",
        cartCount:     "عناصر",
        orderNow:      "اطلب الآن 🔥",
        featured:      "⭐ المميز",
        heroContext:   "يكفي 2–3 أفراد — الأكثر طلباً اليوم 🔥",
    },
    en: {
        loading:       "Loading...",
        error:         "Failed to load menu. Check your connection and try again.",
        retry:         "Retry",
        chooseSize:    "Choose Size",
        addons:        "Add-ons (optional)",
        chooseSizeAlert: "Please choose a size first",
        addToCart:     "Add to Cart",
        selectBtn:     "Order Now",
        cartTitle:     "Cart",
        cartEmpty:     "Cart is empty",
        checkout:      "Confirm Order via WhatsApp 📲",
        currency:      "",
        from:          "From",
        total:         "Total",
        siteTitle:     "Abu Haitham Restaurant",
        siteSlogan:    "Authentic Flavor & Heritage",
        footerTitle:   "Abu Haitham Restaurant",
        footerSlogan:  "Authentic Flavor & Heritage",
        mapText:       "View on Map",
        cartCount:     "items",
        orderNow:      "Order Now 🔥",
        featured:      "⭐ Featured",
        heroContext:   "Serves 2–3 People — Most Ordered Today 🔥",
    }
};

function ui(key) {
    return UI_TEXT[currentLang][key] || UI_TEXT["ar"][key];
}

function initUI() {
    fetchMenuData();

    /* ── كل event listeners في مكان واحد ── */
    const btnLang      = document.getElementById("btn-lang");
    const floatingCart = document.getElementById("floating-cart");
    const btnCloseCart = document.getElementById("btn-close-cart");

    if (btnLang)      btnLang.addEventListener("click", toggleLanguage);
    if (floatingCart) floatingCart.addEventListener("click", openCartModal);
    if (btnCloseCart) btnCloseCart.addEventListener("click", closeCartModal);

    /* الـ Offline UX (تنبيه ذكي للنت الضعيف) */
    window.addEventListener('offline', updateOfflineBanner);
    window.addEventListener('online', updateOfflineBanner);
    updateOfflineBanner();
}

function updateOfflineBanner() {
    let banner = document.getElementById("offline-banner");
    if (!navigator.onLine) {
        if (!banner) {
            banner = document.createElement("div");
            banner.id = "offline-banner";
            banner.style.cssText = "background:#ff9800;color:#fff;text-align:center;padding:0.4rem;font-size:0.8rem;font-weight:700;position:sticky;top:0;z-index:9999;";
            banner.textContent = ui("offlineMsg") || "📡 النت غير متصل — بنعرض آخر منيو محفوظ";
            document.body.prepend(banner);
        }
    } else if (banner) {
        banner.remove();
    }
}

document.addEventListener("DOMContentLoaded", initUI);



function toggleLanguage() {
    currentLang = currentLang === "ar" ? "en" : "ar";

    // اتجاه الصفحة
    document.documentElement.lang = currentLang;
    document.documentElement.dir = currentLang === "ar" ? "rtl" : "ltr";

    // زرار اللغة
    const btn = getEl("btn-lang");
    if (btn) btn.textContent = currentLang === "ar" ? "EN" : "ع";

    // هيدر
    const siteTitle = getEl("site-title");
    if (siteTitle) siteTitle.textContent = ui("siteTitle");
    const siteSlogan = getEl("site-slogan");
    if (siteSlogan) siteSlogan.textContent = ui("siteSlogan");

    // فوتر
    const footerTitle = getEl("footer-title");
    if (footerTitle) footerTitle.textContent = ui("footerTitle");
    const footerSlogan = getEl("footer-slogan");
    if (footerSlogan) footerSlogan.textContent = ui("footerSlogan");
    const footerMapText = getEl("footer-map-text");
    if (footerMapText) footerMapText.textContent = ui("mapText");

    // زرار الـ checkout
    const checkout = getEl("btn-checkout");
    if (checkout) checkout.textContent = ui("checkout");

    // عنوان السلة
    const cartTitle = getEl("cart-title");
    if (cartTitle) cartTitle.textContent = ui("cartTitle");

    // إعادة رسم المنيو
    if (menuDataCache) generateMenu(menuDataCache);

    // تحديث عدد عناصر السلة
    if (typeof updateCartUI === "function") updateCartUI();
}

function t(item, field) {
    if (currentLang === "en" && item[field + "_en"]) return item[field + "_en"];
    return item[field] || "";
}

async function fetchMenuData() {
    const container = getEl("menu-container");
    if (container) {
        container.innerHTML = "";
        const msg = document.createElement("p");
        msg.className = "loading-msg";
        msg.textContent = ui("loading");
        container.appendChild(msg);
    }

    try {
        const res = await fetch("menu.json");
        if (!res.ok) throw new Error("network");
        menuDataCache = await res.json();
        if (!menuDataCache || !menuDataCache.categories || !Array.isArray(menuDataCache.categories)) throw new Error("format");

        window.menuDataCache = menuDataCache;
        window.isMenuReady = true;
        window.dispatchEvent(new Event('menu:ready'));

        generateMenu(menuDataCache);
    } catch(e) {
        window.isMenuReady = false;
        window.dispatchEvent(new CustomEvent('menu:failed'));
        try {
            localStorage.setItem("last_error", JSON.stringify({
                message: e.toString(),
                module: "fetchMenuData",
                time: new Date().toISOString()
            }));
        } catch (_) {}
        if (container) {
            container.innerHTML = "";
            const msg = document.createElement("p");
            msg.style.cssText = "text-align:center;padding:2rem;color:#c00;";
            msg.textContent = ui("error");
            const retry = document.createElement("button");
            retry.textContent = ui("retry");
            retry.style.cssText = "display:block;margin:1rem auto;padding:.6rem 1.5rem;background:#D32F2F;color:#fff;border:none;border-radius:8px;cursor:pointer;font-family:inherit;font-size:1rem;";
            retry.addEventListener("click", fetchMenuData);
            container.appendChild(msg);
            container.appendChild(retry);
        }
    }
}

/* ========================= NAV ========================= */
function buildNav(categories, hasFeatured) {
    const nav = getEl("category-nav");
    if (!nav) return;
    nav.innerHTML = "";

    /* زرار "المميز" يظهر أولاً لو في hero */
    if (hasFeatured) {
        const featBtn = document.createElement("button");
        featBtn.className = "nav-btn nav-btn--featured";
        featBtn.textContent = ui("featured");
        featBtn.addEventListener("click", () => {
            const hero = document.getElementById("hero-section");
            if (hero) hero.scrollIntoView({ behavior: "smooth", block: "start" });
        });
        nav.appendChild(featBtn);
    }

    categories.forEach(cat => {
        if (!cat.items || cat.items.length === 0) return;
        const btn = document.createElement("button");
        btn.className = "nav-btn";
        btn.textContent = t(cat, "name");
        btn.addEventListener("click", () => {
            const section = document.getElementById("cat-" + cat.id);
            if (section) section.scrollIntoView({ behavior: "smooth", block: "start" });
        });
        nav.appendChild(btn);
    });
}

/* ========================= HERO SECTION ========================= */
function renderHero(data) {
    if (!data || !data.categories || !Array.isArray(data.categories)) return null;

    /* نبحث عن أول عنصر highlight=true في كل الأقسام */
    let featuredItem = null;
    for (const cat of data.categories) {
        const found = (cat.items || []).find(i => i.highlight);
        if (found) { featuredItem = found; break; }
    }

    /* Fallback UX: لو مفيش highlight، نعرض أول عنصر وخلاص عشان الـ Layout مش يبوظ */
    if (!featuredItem) {
        for (const cat of data.categories) {
            if (cat.items && cat.items.length > 0) {
                featuredItem = cat.items[0];
                break;
            }
        }
    }
    if (!featuredItem) return null;

    const hero = document.createElement("section");
    hero.id = "hero-section";
    hero.className = "hero-section";

    /* Badge */
    if (featuredItem.badge) {
        const badge = document.createElement("span");
        badge.className = "hero-badge";
        badge.textContent = currentLang === "en" && featuredItem.badge_en
            ? featuredItem.badge_en : featuredItem.badge;
        hero.appendChild(badge);
    }

    /* صورة */
    if (featuredItem.image) {
        const img = document.createElement("img");
        img.className = "hero-img";
        img.src = featuredItem.image;
        img.alt = t(featuredItem, "name");
        img.loading = "eager";
        img.onerror = () => { img.style.display = "none"; };
        hero.appendChild(img);
    }

    /* معلومات + زرار */
    const info = document.createElement("div");
    info.className = "hero-info";

    const title = document.createElement("h2");
    title.className = "hero-title";
    title.textContent = t(featuredItem, "name");
    info.appendChild(title);

    /* سطر context البيع — يخلي العميل يطلب فوراً */
    const ctx = document.createElement("p");
    ctx.className = "hero-context";
    ctx.textContent = ui("heroContext");
    info.appendChild(ctx);
    if (featuredItem.description) {
        const desc = document.createElement("p");
        desc.className = "hero-desc";
        desc.textContent = t(featuredItem, "description");
        info.appendChild(desc);
    }

    const price = document.createElement("p");
    price.className = "hero-price";
    price.textContent = featuredItem.price;
    info.appendChild(price);

    const btn = document.createElement("button");
    btn.className = "btn-hero";
    btn.textContent = ui("orderNow");
    btn.addEventListener("click", () => openItemModal(featuredItem, data.global_addons || []));
    info.appendChild(btn);

    hero.appendChild(info);
    return hero;
}

/* ========================= MENU RENDER ========================= */
function generateMenu(data) {
    const container = getEl("menu-container");
    if (!container) return;
    container.innerHTML = "";

    const hero = renderHero(data);
    buildNav(data.categories, !!hero);
    if (hero) container.appendChild(hero);

    /* ترتيب ذكي للأقسام بدون تعديل JSON */
    const sortedCategories = ["family-offers", "sandwiches", "meals", "by-kilo", "salads"];
    const cats = [...data.categories].sort((a, b) => {
        let ai = sortedCategories.indexOf(a.id);
        let bi = sortedCategories.indexOf(b.id);
        if (ai === -1) ai = 999;
        if (bi === -1) bi = 999;
        return ai - bi;
    });

    cats.forEach(cat => {
        if (!cat.items || cat.items.length === 0) return;

        const section = document.createElement("section");
        section.id = "cat-" + cat.id;
        section.className = "menu-section";

        const heading = document.createElement("h2");
        heading.className = "section-title";
        heading.textContent = t(cat, "name");
        section.appendChild(heading);

        if (cat.note) {
            const note = document.createElement("p");
            note.className = "section-note";
            note.textContent = t(cat, "note");
            section.appendChild(note);
        }

        const grid = document.createElement("div");
        grid.className = "menu-grid";

        cat.items.forEach(item => {
            grid.appendChild(buildCard(item, data.global_addons));
        });

        section.appendChild(grid);
        container.appendChild(section);
    });
}

function buildCard(item, globalAddons) {
    const card = document.createElement("div");
    card.className = "menu-card" + (item.highlight ? " highlight" : "");

    if (item.badge) {
        const badge = document.createElement("span");
        badge.className = "card-badge";
        badge.textContent = currentLang === "en" && item.badge_en ? item.badge_en : item.badge;
        card.appendChild(badge);
    }

    if (item.image) {
        const wrap = document.createElement("div");
        wrap.className = "menu-img-wrap";
        const img = document.createElement("img");
        img.className = "menu-img";
        img.src = item.image;
        img.alt = t(item, "name");
        img.loading = "lazy";
        img.decoding = "async";
        img.onerror = () => { wrap.style.display = "none"; };
        wrap.appendChild(img);
        card.appendChild(wrap);
    }

    const info = document.createElement("div");
    info.className = "card-info";

    const title = document.createElement("h3");
    title.textContent = t(item, "name");
    info.appendChild(title);

    if (item.description) {
        const desc = document.createElement("p");
        desc.className = "card-desc";
        desc.textContent = t(item, "description");
        info.appendChild(desc);
    }

    const price = document.createElement("p");
    price.className = "price-hint";
    if (item.variants && item.variants.length) {
        price.textContent = ui("from") + " " + item.variants[0].price;
    } else {
        price.textContent = item.price;
    }
    info.appendChild(price);
    card.appendChild(info);

    const btn = document.createElement("button");
    btn.className = "btn-add";
    btn.textContent = ui("selectBtn");
    btn.addEventListener("click", () => openItemModal(item, globalAddons));
    card.appendChild(btn);

    return card;
}

/* ========================= ITEM MODAL ========================= */
function openItemModal(item, globalAddons) {
    const existing = document.getElementById("item-modal-overlay");
    if (existing) document.body.removeChild(existing);

    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.id = "item-modal-overlay";
    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) document.body.removeChild(overlay);
    });

    const modal = document.createElement("div");
    modal.className = "modal-content";

    /* HEADER */
    const header = document.createElement("div");
    header.className = "modal-header";
    const title = document.createElement("h2");
    title.textContent = t(item, "name");
    const closeBtn = document.createElement("button");
    closeBtn.textContent = "×";
    closeBtn.setAttribute("aria-label", "إغلاق");
    closeBtn.addEventListener("click", () => document.body.removeChild(overlay));
    header.appendChild(title);
    header.appendChild(closeBtn);

    /* BODY */
    const body = document.createElement("div");
    body.className = "modal-body";

    if (item.description) {
        const desc = document.createElement("p");
        desc.className = "modal-desc";
        desc.textContent = t(item, "description");
        body.appendChild(desc);
    }

    let selectedVariant = null;
    const selectedAddons = new Set();

    /* VARIANTS */
    if (item.variants && item.variants.length) {
        const vTitle = document.createElement("p");
        vTitle.className = "modal-section-title";
        vTitle.textContent = ui("chooseSize");
        body.appendChild(vTitle);

        const variantsWrap = document.createElement("div");
        variantsWrap.className = "variants-wrap";

        item.variants.forEach(v => {
            const btn = document.createElement("button");
            btn.className = "variant-btn";
            btn.textContent = (currentLang === "en" && v.size_en ? v.size_en : v.size) + " — " + v.price;
            btn.addEventListener("click", () => {
                selectedVariant = v;
                variantsWrap.querySelectorAll(".variant-btn").forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
            });
            variantsWrap.appendChild(btn);
        });
        body.appendChild(variantsWrap);
    }

    /* GLOBAL ADDONS */
    if (globalAddons && globalAddons.length) {
        const aTitle = document.createElement("p");
        aTitle.className = "modal-section-title";
        aTitle.textContent = ui("addons");
        body.appendChild(aTitle);

        globalAddons.forEach(a => {
            const label = document.createElement("label");
            label.className = "addon-label";
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.addEventListener("change", () => {
                if (checkbox.checked) selectedAddons.add(a);
                else selectedAddons.delete(a);
            });
            const txt = document.createTextNode(t(a, "name") + " (+" + a.price + ")");
            label.appendChild(checkbox);
            label.appendChild(txt);
            body.appendChild(label);
        });
    }

    /* FOOTER */
    const footer = document.createElement("div");
    footer.className = "modal-footer";

    const addBtn = document.createElement("button");
    addBtn.className = "btn-add-to-cart";
    addBtn.textContent = ui("addToCart");

    addBtn.addEventListener("click", () => {
        /* منع الضغط المزدوج */
        addBtn.disabled = true;
        setTimeout(() => { if (addBtn) addBtn.disabled = false; }, 800);

        if (item.variants && item.variants.length && !selectedVariant) {
            /* inline message بدل alert() — لا يوقف الـ JS thread */
            let errMsg = footer.querySelector(".size-error-msg");
            if (!errMsg) {
                errMsg = document.createElement("p");
                errMsg.className = "size-error-msg";
                errMsg.style.cssText = "color:#D32F2F;font-size:0.82rem;margin-bottom:0.5rem;text-align:center;";
                footer.insertBefore(errMsg, addBtn);
            }
            errMsg.textContent = ui("chooseSizeAlert");
            setTimeout(() => { if (errMsg) errMsg.textContent = ""; }, 1500);
            return;
        }

        /* تكوين كائن بيانات السلة بدل إرسال نصوص لتسهيل الترجمة والتسعير الديناميكي */
        const addonsKey = [...selectedAddons].map(a => a.id || a.name).sort().join(",");
        const cartId = item.id + "_" + (selectedVariant ? (selectedVariant.id || selectedVariant.size) : "base") + (addonsKey ? "_" + addonsKey : "");

        const payload = {
            id: cartId,
            baseId: item.id,
            variantId: selectedVariant ? (selectedVariant.id || selectedVariant.size) : null,
            addons: [...selectedAddons].map(a => a.id || a.name),
            qty: 1
        };

        /* Feedback بصري ولمسي قبل إغلاق النافذة */
        try { if (navigator.vibrate) navigator.vibrate(50); } catch(_) {}
        const originalText = addBtn.textContent;
        addBtn.textContent = typeof ui === "function" ? (currentLang === "en" ? "Added ✔" : "تمت الإضافة ✔") : "✔️";
        addBtn.style.background = "#25D366";

        setTimeout(() => {
            addToCart(payload);
            document.body.removeChild(overlay);
        }, 400); // تأخير بسيط ليرى العميل التأكيد
    });

    footer.appendChild(addBtn);
    modal.appendChild(header);
    modal.appendChild(body);
    modal.appendChild(footer);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
}
