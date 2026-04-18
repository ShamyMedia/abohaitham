window.cart = window.cart || [];

function safe(n){ return Number(n) || 0; }

function signature(name){
    return name;
}

window.addToCart = function(id, name, price){

    const itemSig = signature(name);

    let existing = cart.find(i => i.signature === itemSig);

    if(existing){
        existing.quantity += 1;
    } else {
        cart.push({
            signature: itemSig,
            name,
            price: safe(price),
            quantity: 1
        });
    }

    updateCartUI();
};

function updateCartUI(){

    let total = 0;
    let count = 0;

    cart.forEach(i=>{
        count += i.quantity;
        total += i.quantity * i.price;
    });

    document.getElementById("cart-count").innerText = count;
    document.getElementById("cart-total").innerText = total;

    const float = document.getElementById("floating-cart");
    if(float){
        float.style.display = cart.length ? "flex" : "none";
    }

    localStorage.setItem("cart", JSON.stringify(cart));
}

window.updateCartUI = updateCartUI;

window.openCartModal = () => {
    document.getElementById("cart-modal").classList.remove("hidden");
};

window.closeCartModal = () => {
    document.getElementById("cart-modal").classList.add("hidden");
};