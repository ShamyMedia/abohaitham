let cart = [];

const Storage = {
    get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch {} }
};

function initCart() {
    try {
        cart = JSON.parse(Storage.get("cart") || "[]");
        if (!Array.isArray(cart)) cart = [];
    } catch {
        cart = [];
    }
}
/* تشغيل المزامنة قبل تفاعل المستخدم (يمنع الـ timing edge case) */
initCart();

/* تأمين window.cart كـ Read-only Getter (يمنع أي سكربت خارجي يلوثه) */
Object.defineProperty(window, "cart", {
    get: () => cart,
    configurable: false,
    enumerable: true
});

/* ── مصدر حساب السعر الوحيد في المشروع ── */
function calculateItemPrice(cartItem) {
    const node = typeof window.getMenuNode === 'function'
        ? window.getMenuNode(cartItem.baseId) : null;
    if (!node) return 0;

    let p = node.price || 0;

    if (cartItem.variantId && node.variants) {
        const v = node.variants.find(
            vx => (vx.id || vx.size) === cartItem.variantId);
        if (v) p = v.price;
    }

    if (cartItem.addons && cartItem.addons.length && window.menuDataCache) {
        cartItem.addons.forEach(aid => {
            const addNode = window.menuDataCache.global_addons
                .find(a => (a.id || a.name) === aid);
            if (addNode) p += addNode.price;
        });
    }

    return p; /* سعر القطعة الواحدة بدون qty */
}
window.calculateItemPrice = calculateItemPrice;

/* ── throttle: يمنع double-click ويسمح بإضافة منتجات مختلفة بسرعة ── */
let _lastAdd = 0;

function addToCart(payload) {
    const now = Date.now();
    if (now - _lastAdd < 300) return;
    _lastAdd = now;

    const item = cart.find(i => i.id === payload.id);
    if (item) {
        item.qty += payload.qty;
    } else {
        cart.push(payload);
    }
    updateCartUI();
}

function removeFromCart(id) {
    cart = cart.filter(i => i.id !== id);
    Storage.set('cart', JSON.stringify(cart));
    updateCartUI();
    renderCart();
}

function increaseQty(id) {
    const item = cart.find(i => i.id === id);
    if (item) {
        item.qty++;
        updateCartUI();
        renderCart();
    }
}

function decreaseQty(id) {
    const item = cart.find(i => i.id === id);
    if (item) {
        item.qty--;
        if (item.qty <= 0) {
            removeFromCart(id);
        } else {
            updateCartUI();
            renderCart();
        }
    }
}

function updateCartUI() {
    // window.cart مؤمن ولا يحتاج إعادة تعيين

    let total = 0;
    let count = 0;
    cart.forEach(cartItem => {
        total += calculateItemPrice(cartItem) * cartItem.qty;
        count += cartItem.qty;
    });

    const countLabel = (typeof ui === "function") ? ui("cartCount") : "عناصر";

    const c1 = document.getElementById("cart-count");
    const c2 = document.getElementById("cart-total");
    if (c1) c1.innerText = count + " " + countLabel;
    if (c2) c2.innerText = total;

    Storage.set("cart", JSON.stringify(cart));
    /* تتبع آخر تعديل — يُمكّن "رجّع آخر طلب" وAnalytics بسيط مستقبلاً */
    if (cart.length > 0) Storage.set("lastOrderTime", String(Date.now()));

    const float = document.getElementById("floating-cart");
    if (float) {
        if (cart.length > 0) float.classList.add("visible");
        else float.classList.remove("visible");
    }

    /* تحديث صريح لحالة زرار الواتساب (يفصل تجربة الاستفسار عن الطلب) */
    const stickyBtn = document.getElementById("sticky-whatsapp");
    if (stickyBtn) {
        if (cart.length > 0) {
            stickyBtn.innerHTML = (typeof ui === "function" ? ui("orderNow") : "تأكيد الطلب") + ' <span style="font-size:1.15em">🛒</span>';
        } else {
            stickyBtn.innerHTML = 'استفسار عبر واتساب <span style="font-size:1.15em">💬</span>';
        }
    }

    /* Event-Driven Architecture Update */
    window.dispatchEvent(new CustomEvent('cart:updated', { detail: cart }));
}

function openCartModal() {
    const modal = document.getElementById("cart-modal");
    if (modal) modal.classList.remove("hidden");
    renderCart();
}

function closeCartModal() {
    const modal = document.getElementById("cart-modal");
    if (modal) modal.classList.add("hidden");
}

function renderCart() {
    const box = document.getElementById("cart-items-container");
    if (!box) return;

    const emptyText = (typeof ui === "function") ? ui("cartEmpty") : "السلة فارغة";

    box.innerHTML = "";

    if (cart.length === 0) {
        const empty = document.createElement("p");
        empty.className = "cart-empty";
        empty.textContent = emptyText;
        box.appendChild(empty);
        return;
    }

    cart.forEach(cartItem => {
        const node = typeof window.getMenuNode === "function" ? window.getMenuNode(cartItem.baseId) : null;
        if (!node) return;

        const itemPrice = calculateItemPrice(cartItem);
        let itemName = typeof t === "function" ? t(node, "name") : cartItem.baseId;

        if (cartItem.variantId && node.variants) {
            const v = node.variants.find(vx => (vx.id || vx.size) === cartItem.variantId);
            if (v) {
                const vName = typeof currentLang !== "undefined" && currentLang === "en" && v.size_en ? v.size_en : v.size;
                itemName += " (" + vName + ")";
            }
        }

        if (cartItem.addons && cartItem.addons.length && window.menuDataCache && window.menuDataCache.global_addons) {
            cartItem.addons.forEach(aid => {
                const addNode = window.menuDataCache.global_addons.find(a => (a.id || a.name) === aid);
                if (addNode) {
                    itemName += " + " + (typeof t === "function" ? t(addNode, "name") : aid);
                }
            });
        }

        const row = document.createElement("div");
        row.className = "cart-item";

        /* اسم الصنف والسعر الكلي */
        const info = document.createElement("span");
        info.textContent = itemName + " — " + (itemPrice * cartItem.qty);

        /* أزرار التحكم في الكمية  – / qty / + */
        const qtyControl = document.createElement("div");
        qtyControl.style.cssText = "display:flex;align-items:center;gap:0.4rem;flex-shrink:0;";

        const minusBtn = document.createElement("button");
        minusBtn.className = "cart-item-remove";
        minusBtn.textContent = "–";
        minusBtn.setAttribute("aria-label", "تقليل " + itemName);
        minusBtn.addEventListener("click", () => decreaseQty(cartItem.id));

        const qtySpan = document.createElement("span");
        qtySpan.textContent = cartItem.qty;
        qtySpan.style.cssText = "min-width:1.5rem;text-align:center;font-weight:700;";

        const plusBtn = document.createElement("button");
        plusBtn.className = "cart-item-remove";
        plusBtn.textContent = "+";
        plusBtn.setAttribute("aria-label", "زيادة " + itemName);
        plusBtn.addEventListener("click", () => increaseQty(cartItem.id));

        qtyControl.appendChild(minusBtn);
        qtyControl.appendChild(qtySpan);
        qtyControl.appendChild(plusBtn);

        row.appendChild(info);
        row.appendChild(qtyControl);
        box.appendChild(row);
    });

    const totalEl = document.getElementById("modal-total-display");
    if (totalEl) {
        const totalLabel = (typeof ui === "function") ? ui("total") : "الإجمالي";
        const realTotal = cart.reduce(
            (sum, ci) => sum + calculateItemPrice(ci) * ci.qty, 0);
        totalEl.textContent = totalLabel + ": " + realTotal;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    if (window.isMenuReady) {
        updateCartUI();
        renderCart();
    } else {
        window.addEventListener('menu:ready', () => {
            updateCartUI();
            renderCart();
        });
        window.addEventListener('menu:failed', () => {
            renderCart();
        });
    }

    /* Event Listeners */
    window.addEventListener("ui:refresh", () => {
        updateCartUI();
        renderCart();
    });
});

window.addToCart     = addToCart;
window.openCartModal = openCartModal;
window.closeCartModal = closeCartModal;
window.increaseQty   = increaseQty;
window.decreaseQty   = decreaseQty;

window.clearCart = function() {
    cart = [];
    Storage.set('cart', "[]");
    updateCartUI();
    renderCart();
};
