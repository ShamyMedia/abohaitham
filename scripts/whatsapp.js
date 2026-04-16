/**
 * WhatsApp Order Integration
 * Note: btnCheckout is defined in cart.js — do NOT redeclare here
 */

const WHATSAPP_NUMBER = "201032858119"; // ← ضع رقم الواتساب الحقيقي هنا

btnCheckout.addEventListener('click', () => {
    if (cart.length === 0) return;

    let message = `*طلب جديد من منيو أبو هيثم*\n\n`;
    let grandTotal = 0;

    cart.forEach(item => {
        message += `▪️ ${item.quantity} × ${item.name}`;
        
        if (item.addons && item.addons.length > 0) {
            const addonNames = item.addons.map(a => a.name).join('، ');
            message += `\n   الإضافات: (${addonNames})`;
        }
        
        const itemTotal = item.quantity * item.totalUnitPrice;
        message += `\n   السعر: ${itemTotal} جنيه\n\n`;
        
        grandTotal += itemTotal;
    });

    message += `──────────────────\n`;
    message += `*الإجمالي: ${grandTotal} جنيه*\n`;
    message += `──────────────────\n`;
    message += `الرجاء تأكيد الطلب وتحديد عنوان التوصيل.`;

    // Limit message length (WhatsApp max URL length safety)
    if (message.length > 4000) {
        message = message.substring(0, 4000) + '\n... (الطلب طويل جداً، يرجى المراجعة)';
    }

    // Encode URL for WhatsApp
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;

    // Anti-Spam (Click Debounce)
    const originalContent = btnCheckout.innerHTML;
    btnCheckout.disabled = true;
    btnCheckout.style.pointerEvents = 'none';
    btnCheckout.style.opacity = '0.5';
    btnCheckout.innerText = 'جاري التحويل... ⏳';

    // --- EVENT TRACKING (Analytics Hook) ---
    // Here you can inject Meta Pixel, Google Analytics, or any tracking logic
    if (typeof window.dataLayer !== 'undefined') {
        window.dataLayer.push({
            'event': 'InitiateCheckout',
            'value': grandTotal,
            'currency': 'EGP',
            'contents': cart.map(item => ({ id: item.signature, quantity: item.quantity, name: item.name }))
        });
    }
    console.log("Tracking Event Logged: InitiateCheckout", grandTotal);
    // ----------------------------------------

    // Open WhatsApp in a new tab/window
    window.open(whatsappUrl, '_blank');

    // Reactivate button after 3 seconds
    setTimeout(() => {
        btnCheckout.disabled = false;
        btnCheckout.style.pointerEvents = 'auto';
        btnCheckout.style.opacity = '1';
        btnCheckout.innerHTML = originalContent;
    }, 3000);
});
