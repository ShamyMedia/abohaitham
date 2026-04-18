document.addEventListener("DOMContentLoaded", () => {

const btn = document.getElementById("btn-checkout");

if(!btn) return;

btn.addEventListener("click", ()=>{

    if(!cart || cart.length === 0) return;

    let msg = "طلب جديد\n\n";
    let total = 0;

    cart.forEach(i=>{
        msg += `${i.quantity} × ${i.name}\n`;
        total += i.quantity * i.price;
    });

    msg += `\nالإجمالي: ${total}`;

    const url = "https://wa.me/201032858119?text=" + encodeURIComponent(msg);

    window.open(url, "_blank");
});

});