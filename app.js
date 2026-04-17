const state = {
  cart: [],
  total: 0
};

const cartText = document.getElementById("cartText");
const orderBtn = document.getElementById("orderBtn");

document.addEventListener("click", (e) => {
  if (e.target.classList.contains("add-btn")) {
    handleAdd(e.target);
  }
});

function handleAdd(btn) {
  const name = btn.dataset.name;
  const price = parseFloat(btn.dataset.price);

  if (!name || isNaN(price)) return;

  state.cart.push({ name, price });
  state.total += price;

  updateCartUI();
}

function updateCartUI() {
  cartText.textContent =
    `🛒 ${state.cart.length} عناصر | ${state.total} جنيه`;
}

orderBtn.addEventListener("click", () => {
  if (state.cart.length === 0) {
    alert("السلة فاضية");
    return;
  }

  let message = "طلب جديد:\n\n";

  state.cart.forEach(item => {
    message += `- ${item.name} = ${item.price} جنيه\n`;
  });

  message += `\nالإجمالي: ${state.total} جنيه`;

  const url = "https://wa.me/201018502926?text=" + encodeURIComponent(message);

  window.open(url, "_blank");
});
