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
    updateCartUI();
}

function addToCart(id, name, price) {
    const item = cart.find(i => i.id === id);
    if (item) {
        item.qty++;
    } else {
        cart.push({ id, name, price, qty: 1 });
    }
    updateCartUI();
}

function removeFromCart(id) {
    cart = cart.filter(i => i.id !== id);
    updateCartUI();
    renderCart();
}

function updateCartUI() {
    window.cart = cart;

    let total = 0;
    let count = 0;
    cart.forEach(i => {
        total += i.price * i.qty;
        count += i.qty;
    });

    const c1 = document.getElementById("cart-count");
    const c2 = document.getElementById("cart-total");
    if (c1) c1.innerText = count + " عناصر";
    if (c2) c2.innerText = total + " جنيه";

    Storage.set("cart", JSON.stringify(cart));

    const float = document.getElementById("floating-cart");
    if (float) {
        if (cart.length > 0) float.classList.add("visible");
        else float.classList.remove("visible");
    }
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

    box.innerHTML = "";

    if (cart.length === 0) {
        const empty = document.createElement("p");
        empty.className = "cart-empty";
        empty.textContent = "السلة فارغة";
        box.appendChild(empty);
        return;
    }

    cart.forEach(i => {
        const row = document.createElement("div");
        row.className = "cart-item";

        const info = document.createElement("span");
        info.textContent = i.name + " × " + i.qty + " — " + (i.price * i.qty) + " جنيه";

        const delBtn = document.createElement("button");
        delBtn.className = "cart-item-remove";
        delBtn.textContent = "حذف";
        delBtn.setAttribute("aria-label", "حذف " + i.name);
        delBtn.addEventListener("click", () => removeFromCart(i.id));

        row.appendChild(info);
        row.appendChild(delBtn);
        box.appendChild(row);
    });

    // إجمالي
    const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
    const totalEl = document.getElementById("modal-total-display");
    if (totalEl) totalEl.textContent = "الإجمالي: " + total + " جنيه";
}

document.addEventListener("DOMContentLoaded", initCart);

window.addToCart = addToCart;
window.openCartModal = openCartModal;
window.closeCartModal = closeCartModal;
