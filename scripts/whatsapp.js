const WHATSAPP_NUMBER = '201032858119'; // غيّر لو الرقم اتغير
let _awaitingConfirm = false;

function sendWhatsAppOrder(e) {
    if (e && e.currentTarget) {
        const t = e.currentTarget;
        t.style.pointerEvents = 'none';
        setTimeout(() => { if (t) t.style.pointerEvents = 'auto'; }, 800);
    }
    if (e) e.preventDefault();

    /* ── سلة فارغة: افتح واتساب للاستفسار ── */
    if (!window.cart || window.cart.length === 0) {
        window.open(
            'https://wa.me/' + WHATSAPP_NUMBER +
            '?text=' + encodeURIComponent('مرحباً مطعم أبو هيثم 🍽️ أريد الاستفسار عن المنيو'),
            '_blank'
        );
        return;
    }

    const form = document.getElementById('customer-form');
    const nameInput = document.getElementById('customer-name');
    const addrInput = document.getElementById('customer-address');
    const errorMsg = document.getElementById('customer-form-error');

    // أول ضغطة: نظهر الفورم
    if (!_awaitingConfirm) {
        if (form) form.style.display = 'block';
        if (nameInput) nameInput.focus();
        _awaitingConfirm = true;
        const btn = document.getElementById('btn-checkout');
        if (btn) btn.textContent = 'إرسال الطلب ✅';
        return;
    }

    // ثاني ضغطة: نتحقق ونرسل
    const name = nameInput ? nameInput.value.trim() : '';
    const address = addrInput ? addrInput.value.trim() : '';

    if (!name || !address) {
        if (errorMsg) errorMsg.style.display = 'block';
        return;
    }
    if (errorMsg) errorMsg.style.display = 'none';

    // بناء الرسالة
    let msg = '🍽️ طلب جديد — مطعم أبو هيثم\n';
    msg += '━━━━━━━━━━━━━━━\n\n';
    let total = 0;

    window.cart.forEach(cartItem => {
        const node = typeof window.getMenuNode === 'function'
            ? window.getMenuNode(cartItem.baseId) : null;
        if (!node) return;

        const unitPrice = typeof window.calculateItemPrice === 'function'
            ? window.calculateItemPrice(cartItem) : 0;
        const lineTotal = unitPrice * cartItem.qty;
        total += lineTotal;

        let itemName = (typeof t === 'function') ? t(node, 'name') : node.name;
        if (cartItem.variantId && node.variants) {
            const v = node.variants.find(
                vx => (vx.id || vx.size) === cartItem.variantId);
            if (v) {
                const sizeName = (typeof currentLang !== 'undefined' && currentLang === 'en' && v.size_en)
                    ? v.size_en : v.size;
                itemName += ' (' + sizeName + ')';
            }
        }
        msg += cartItem.qty + ' × ' + itemName + ' — ' + lineTotal + '\n';

        if (cartItem.addons && cartItem.addons.length && window.menuDataCache) {
            cartItem.addons.forEach(aid => {
                const addNode = window.menuDataCache.global_addons
                    .find(a => (a.id || a.name) === aid);
                if (addNode) {
                    const addName = (typeof t === 'function') ? t(addNode, 'name') : addNode.name;
                    msg += '   ➕ ' + addName + '\n';
                }
            });
        }
    });

    msg += '\n━━━━━━━━━━━━━━━\n';
    msg += '💰 الإجمالي: ' + total + '\n\n';
    msg += '👤 الاسم: ' + name + '\n';
    msg += '📍 عنوان التوصيل: ' + address + '\n';
    msg += '\n📌 مطعمنا: 74 ش مجلس الشعب - السيدة زينب - أمام مسجد الشيخ صالح';

    // reset الفورم
    _awaitingConfirm = false;
    const btn = document.getElementById('btn-checkout');
    if (btn) btn.textContent = 'تأكيد الطلب عبر واتساب 📲';
    if (form) form.style.display = 'none';
    if (nameInput) nameInput.value = '';
    if (addrInput) addrInput.value = '';

    window.open(
        'https://wa.me/' + WHATSAPP_NUMBER +
        '?text=' + encodeURIComponent(msg), '_blank');

    // 🧱 3. تأكيد واضح بإنهاء الحالة وتفريغ السلة
    if (typeof window.clearCart === 'function') window.clearCart();
    if (typeof window.closeCartModal === 'function') window.closeCartModal();
}

function resetCheckoutForm() {
    _awaitingConfirm = false;
    const form = document.getElementById('customer-form');
    const btn = document.getElementById('btn-checkout');
    if (form) form.style.display = 'none';
    if (btn) btn.textContent = 'تأكيد الطلب عبر واتساب 📲';
}

document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('btn-checkout');
    if (btn) btn.addEventListener('click', sendWhatsAppOrder);
    const stickyBtn = document.getElementById('sticky-whatsapp');
    if (stickyBtn) stickyBtn.addEventListener('click', sendWhatsAppOrder);
    const closeBtn = document.getElementById('btn-close-cart');
    if (closeBtn) closeBtn.addEventListener('click', resetCheckoutForm);
});
