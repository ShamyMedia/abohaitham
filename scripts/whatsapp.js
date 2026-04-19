const WHATSAPP_NUMBER = "201032858119";

document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("btn-checkout");
    if (!btn) return;

    btn.addEventListener("click", () => {
        if (!window.cart || window.cart.length === 0) return;

        let msg = "طلب جديد من مطعم أبو هيثم\n\n";
        let total = 0;

        window.cart.forEach(i => {
            msg += i.qty + " × " + i.name + " — " + (i.qty * i.price) + " جنيه\n";
            total += i.qty * i.price;
        });

        msg += "\nالإجمالي: " + total + " جنيه";

        window.open(
            "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(msg),
            "_blank"
        );
    });
});
