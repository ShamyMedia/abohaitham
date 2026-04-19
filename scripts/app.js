let currentLang = "ar";
let menuDataCache = null;

document.addEventListener("DOMContentLoaded", () => {
    fetchMenuData();
});

function getEl(id) {
    return document.getElementById(id);
}

function toggleLanguage() {
    currentLang = currentLang === "ar" ? "en" : "ar";
}

async function fetchMenuData() {
    try {
        const res = await fetch("menu.json");
        if (!res.ok) throw new Error("network");
        menuDataCache = await res.json();
        if (!Array.isArray(menuDataCache)) throw new Error("format");
        generateMenu(menuDataCache);
    } catch(e) {
        const el = getEl("menu-container");
        if (el) el.textContent = "خطأ في تحميل المنيو";
    }
}

/* ========================= MENU RENDER ========================= */
function generateMenu(items) {
    const container = getEl("menu-container");
    if (!container) return;

    container.innerHTML = "";

    items.forEach(item => {
        const card = document.createElement("div");
        card.className = "menu-card";

        const title = document.createElement("h3");
        title.textContent = item.name;

        // عرض أول سعر متاح كـ hint للمستخدم
        if (item.variants && item.variants.length) {
            const priceHint = document.createElement("p");
            priceHint.className = "price-hint";
            priceHint.textContent = "من " + item.variants[0].price + " جنيه";
            card.appendChild(title);
            card.appendChild(priceHint);
        } else {
            card.appendChild(title);
        }

        const btn = document.createElement("button");
        btn.className = "btn-add";
        btn.textContent = "اختيار";
        btn.addEventListener("click", () => openItemModal(item));

        card.appendChild(btn);
        container.appendChild(card);
    });
}

/* ========================= ITEM MODAL ========================= */
function openItemModal(item) {
    // منع تراكم المودالز
    const existing = document.getElementById("item-modal-overlay");
    if (existing) document.body.removeChild(existing);

    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.id = "item-modal-overlay";

    // إغلاق عند الضغط خارج المودال
    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) document.body.removeChild(overlay);
    });

    const modal = document.createElement("div");
    modal.className = "modal-content";

    /* HEADER */
    const header = document.createElement("div");
    header.className = "modal-header";

    const title = document.createElement("h2");
    title.textContent = item.name;

    const closeBtn = document.createElement("button");
    closeBtn.textContent = "×";
    closeBtn.setAttribute("aria-label", "إغلاق");
    closeBtn.addEventListener("click", () => document.body.removeChild(overlay));

    header.appendChild(title);
    header.appendChild(closeBtn);

    /* BODY */
    const body = document.createElement("div");
    body.className = "modal-body";

    let selectedVariant = null;
    const selectedAddons = new Set();

    /* VARIANTS */
    if (item.variants && item.variants.length) {
        const vTitle = document.createElement("p");
        vTitle.className = "modal-section-title";
        vTitle.textContent = "اختار الحجم";
        body.appendChild(vTitle);

        const variantsWrap = document.createElement("div");
        variantsWrap.className = "variants-wrap";

        item.variants.forEach(v => {
            const btn = document.createElement("button");
            btn.className = "variant-btn";
            btn.textContent = v.label + " — " + v.price + " جنيه";

            btn.addEventListener("click", () => {
                selectedVariant = v;
                variantsWrap.querySelectorAll(".variant-btn").forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
            });

            variantsWrap.appendChild(btn);
        });

        body.appendChild(variantsWrap);
    }

    /* ADDONS */
    if (item.addons && item.addons.length) {
        const aTitle = document.createElement("p");
        aTitle.className = "modal-section-title";
        aTitle.textContent = "إضافات (اختياري)";
        body.appendChild(aTitle);

        item.addons.forEach(a => {
            const label = document.createElement("label");
            label.className = "addon-label";

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";

            checkbox.addEventListener("change", () => {
                if (checkbox.checked) selectedAddons.add(a);
                else selectedAddons.delete(a);
            });

            const txt = document.createTextNode(a.name + " (+" + a.price + " جنيه)");

            label.appendChild(checkbox);
            label.appendChild(txt);
            body.appendChild(label);
        });
    }

    /* FOOTER — زرار الإضافة */
    const footer = document.createElement("div");
    footer.className = "modal-footer";

    const addBtn = document.createElement("button");
    addBtn.textContent = "إضافة للسلة";

    addBtn.addEventListener("click", () => {
        if (item.variants && item.variants.length && !selectedVariant) {
            alert("اختار الحجم أولاً");
            return;
        }

        const nameParts = [item.name];
        let finalPrice = 0;

        if (selectedVariant) {
            nameParts.push("(" + selectedVariant.label + ")");
            finalPrice += selectedVariant.price;
        } else if (item.price) {
            finalPrice = item.price;
        }

        selectedAddons.forEach(a => {
            nameParts.push("+ " + a.name);
            finalPrice += a.price;
        });

        const finalName = nameParts.join(" ");
        const addonsKey = [...selectedAddons].map(a => a.id).sort().join(",");
        const cartId = item.id + "_" + (selectedVariant ? selectedVariant.id : "none") + "_" + addonsKey;

        addToCart(cartId, finalName, finalPrice);
        document.body.removeChild(overlay);
    });

    footer.appendChild(addBtn);

    /* ASSEMBLE */
    modal.appendChild(header);
    modal.appendChild(body);
    modal.appendChild(footer);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
}
