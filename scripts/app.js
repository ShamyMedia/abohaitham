let currentLang = "ar";
let menuDataCache = null;

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
        selectBtn:     "اختيار",
        cartTitle:     "السلة",
        cartEmpty:     "السلة فارغة",
        checkout:      "تأكيد الطلب عبر واتساب 📲",
        currency:      "جنيه",
        from:          "من",
        total:         "الإجمالي",
        siteTitle:     "مطعم أبو هيثم",
        siteSlogan:    "أصل التسوية والمذاق الأصيل",
        footerTitle:   "مطعم أبو هيثم",
        footerSlogan:  "أصل التسوية والمذاق الأصيل",
        mapText:       "الموقع على الخريطة",
        cartCount:     "عناصر",
    },
    en: {
        loading:       "Loading...",
        error:         "Failed to load menu. Check your connection and try again.",
        retry:         "Retry",
        chooseSize:    "Choose Size",
        addons:        "Add-ons (optional)",
        chooseSizeAlert: "Please choose a size first",
        addToCart:     "Add to Cart",
        selectBtn:     "Select",
        cartTitle:     "Cart",
        cartEmpty:     "Cart is empty",
        checkout:      "Confirm Order via WhatsApp 📲",
        currency:      "EGP",
        from:          "From",
        total:         "Total",
        siteTitle:     "Abu Haitham Restaurant",
        siteSlogan:    "Authentic Flavor & Heritage",
        footerTitle:   "Abu Haitham Restaurant",
        footerSlogan:  "Authentic Flavor & Heritage",
        mapText:       "View on Map",
        cartCount:     "items",
    }
};

function ui(key) {
    return UI_TEXT[currentLang][key] || UI_TEXT["ar"][key];
}

document.addEventListener("DOMContentLoaded", () => {
    fetchMenuData();
});

function getEl(id) { return document.getElementById(id); }

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
        if (!menuDataCache.categories) throw new Error("format");
        generateMenu(menuDataCache);
    } catch(e) {
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
function buildNav(categories) {
    const nav = getEl("category-nav");
    if (!nav) return;
    nav.innerHTML = "";
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

/* ========================= MENU RENDER ========================= */
function generateMenu(data) {
    const container = getEl("menu-container");
    if (!container) return;
    container.innerHTML = "";

    buildNav(data.categories);

    data.categories.forEach(cat => {
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
        price.textContent = ui("from") + " " + item.variants[0].price + " " + ui("currency");
    } else {
        price.textContent = item.price + " " + ui("currency");
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
            btn.textContent = (currentLang === "en" && v.size_en ? v.size_en : v.size) + " — " + v.price + " " + ui("currency");
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
            const txt = document.createTextNode(t(a, "name") + " (+" + a.price + " " + ui("currency") + ")");
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
        if (item.variants && item.variants.length && !selectedVariant) {
            alert(ui("chooseSizeAlert"));
            return;
        }

        const nameParts = [t(item, "name")];
        let finalPrice = 0;

        if (selectedVariant) {
            nameParts.push("(" + (currentLang === "en" && selectedVariant.size_en ? selectedVariant.size_en : selectedVariant.size) + ")");
            finalPrice += selectedVariant.price;
        } else {
            finalPrice = item.price;
        }

        selectedAddons.forEach(a => {
            nameParts.push("+ " + t(a, "name"));
            finalPrice += a.price;
        });

        const finalName = nameParts.join(" ");
        const addonsKey = [...selectedAddons].map(a => a.id).sort().join(",");
        const cartId = item.id + "_" + (selectedVariant ? selectedVariant.id : "none") + "_" + addonsKey;

        addToCart(cartId, finalName, finalPrice);
        document.body.removeChild(overlay);
    });

    footer.appendChild(addBtn);
    modal.appendChild(header);
    modal.appendChild(body);
    modal.appendChild(footer);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
}
