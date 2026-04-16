/**
 * Cart State Management (Array approach for friction-less ordering + localStorage)
 */

let cart = [];
try {
    const savedCart = localStorage.getItem('abuHaithamCart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
        if (!Array.isArray(cart)) cart = []; // Guard against corrupted non-array data
    }
} catch (e) {
    console.warn("Cart data reset due to parsing error");
    cart = [];
}

// Get element references
const cartCount = document.getElementById('cart-count');
const cartTotal = document.getElementById('cart-total');
const floatingCart = document.getElementById('floating-cart');
const cartModal = document.getElementById('cart-modal');
const cartItemsContainer = document.getElementById('cart-items-container');
const modalTotalDisplay = document.getElementById('modal-total-display');
const btnCheckout = document.getElementById('btn-checkout');

function addToCart(baseId, name, price) {
  // 1. Gather selected options/variants from the card
  const card = document.querySelector(`.menu-card[data-id="${baseId}"]`);
  if (!card) return;

  let finalName = name;
  let finalPrice = price;
  
  // Check if variant is selected
  const variantSelect = card.querySelector(`select[data-for="${baseId}"]`);
  if (variantSelect) {
      const selectedOption = variantSelect.options[variantSelect.selectedIndex];
      finalName += ` (${selectedOption.dataset.size})`;
      finalPrice = parseInt(selectedOption.dataset.price);
  }

  // 2. Gather selected Add-ons (Quick Add-ons)
  const addons = [];
  const addonCheckboxes = card.querySelectorAll(`.addon-checkbox[data-for="${baseId}"]:checked`);
  
  addonCheckboxes.forEach(cb => {
      addons.push({
          name: cb.dataset.name,
          price: parseInt(cb.dataset.price)
      });
  });

  // Calculate total price of addons
  const addonsTotal = addons.reduce((sum, addon) => sum + addon.price, 0);
  
  // 3. Create Item Signature to group identical items
  const itemSignature = JSON.stringify({ name: finalName, addons: addons });

  // 4. Check if item already exists in cart
  const existingItemIndex = cart.findIndex(item => item.signature === itemSignature);

  if (existingItemIndex > -1) {
      cart[existingItemIndex].quantity += 1;
  } else {
      cart.push({
          signature: itemSignature,
          name: finalName,
          basePrice: finalPrice,
          addonsTotal: addonsTotal,
          totalUnitPrice: finalPrice + addonsTotal,
          quantity: 1,
          addons: addons
      });
  }

  // 5. Update UI & Save
  updateCartUI();
  
  // Provide visual feedback (Optional but good for UX)
  const btn = card.querySelector('.btn-add');
  if (btn) {
      const originalText = btn.innerText;
      btn.innerText = "✓ تم الإضافة";
      btn.style.backgroundColor = "#128C7E";
      setTimeout(() => {
          btn.innerText = originalText;
          btn.style.backgroundColor = "";
      }, 1000);
  }

  // --- EVENT TRACKING: AddToCart ---
  if (typeof window.dataLayer !== 'undefined') {
      window.dataLayer.push({
          'event': 'AddToCart',
          'itemName': finalName,
          'price': finalPrice + addonsTotal,
          'currency': 'EGP'
      });
  }
  console.log("Tracking Event Logged: AddToCart", finalName);
  // ---------------------------------
}

// Function to update quantity (+/-) from a future Cart UI Modal
function updateQuantity(signature, change) {
    const index = cart.findIndex(item => item.signature === signature);
    if (index > -1) {
        const parsedChange = parseInt(change) || 0;
        let newQty = cart[index].quantity + parsedChange;
        newQty = Math.max(0, parseInt(newQty) || 0);
        
        cart[index].quantity = newQty;
        
        if (cart[index].quantity <= 0) {
            cart.splice(index, 1); // Remove item if quantity is 0
        }
    }
    updateCartUI();
}

// Function to clear Cart
function clearCart() {
    cart = [];
    updateCartUI();
    closeCartModal();
}

// UI Modals triggers
function openCartModal() {
    renderCartModal();
    cartModal.classList.remove('hidden');
    checkBusinessHours();
}

function closeCartModal() {
    cartModal.classList.add('hidden');
}

function renderCartModal() {
    cartItemsContainer.innerHTML = '';
    
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p style="text-align:center; padding: 2rem;">السلة فارغة</p>';
        return;
    }

    cart.forEach(item => {
        let addonsText = item.addons.map(a => a.name).join('، ');
        let addonsHTML = addonsText ? `<div class="c-item-addons">+ ${addonsText}</div>` : '';
        
        // Escape signature for HTML onClick
        const safeSignature = item.signature.replace(/'/g, "\\'").replace(/"/g, '&quot;');
        
        const itemHTML = `
            <div class="cart-modal-item">
                <div class="c-item-details">
                    <div class="c-item-name">${item.name}</div>
                    ${addonsHTML}
                    <div class="c-item-price">${item.totalUnitPrice * item.quantity} ج</div>
                </div>
                <div class="c-item-controls">
                    <button class="btn-qty" onclick="updateQuantity('${safeSignature}', -1)">-</button>
                    <span class="qty-val">${item.quantity}</span>
                    <button class="btn-qty" onclick="updateQuantity('${safeSignature}', 1)">+</button>
                </div>
            </div>
        `;
        cartItemsContainer.insertAdjacentHTML('beforeend', itemHTML);
    });
}

// Check Business Hours Constraint (1 PM - 3 AM)
function checkBusinessHours() {
    const now = new Date();
    const currentHour = now.getHours(); // Local Time 0 to 23
    
    // Logic: Open if hour >= 13 (1 PM) OR hour < 3 (3 AM)
    const isOpen = (currentHour >= 13 || currentHour < 3);
    
    const notice = document.getElementById('business-hours-notice');
    if (!isOpen) {
        notice.classList.remove('hidden');
        btnCheckout.style.opacity = '0.5';
        btnCheckout.style.pointerEvents = 'none';
        btnCheckout.innerText = "المطعم مغلق الآن";
    } else {
        notice.classList.add('hidden');
        btnCheckout.style.opacity = '1';
        btnCheckout.style.pointerEvents = 'auto';
        btnCheckout.innerHTML = `
            <span>تأكيد الطلب واتساب</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
        `;
    }
}


function updateCartUI() {
  if (cart.length === 0) {
      floatingCart.classList.remove('visible');
      if (!cartModal.classList.contains('hidden')) {
          closeCartModal();
      }
  }

  let totalItems = 0;
  let totalPrice = 0;

  cart.forEach(item => {
      const qty = Math.max(0, parseInt(item.quantity) || 0);
      const price = Math.max(0, parseInt(item.totalUnitPrice) || 0);
      
      totalItems += qty;
      totalPrice += (price * qty);
  });

  cartCount.innerText = `${totalItems} عناصر`;
  cartTotal.innerText = `الإجمالي: ${totalPrice} جنيه`;
  
  if (modalTotalDisplay) {
      modalTotalDisplay.innerText = `الإجمالي: ${totalPrice} جنيه`;
  }
  
  // Save to localStorage whenever UI updates
  try {
      localStorage.setItem('abuHaithamCart', JSON.stringify(cart));
  } catch (e) {
      console.warn('LocalStorage quota exceeded or disabled. Using memory only.', e);
  }
  
  // Re-render modal details if it's currently open
  if (!cartModal.classList.contains('hidden')) {
      renderCartModal();
  }
  
  if (!floatingCart.classList.contains('visible') && cart.length > 0) {
      floatingCart.classList.add('visible');
  }
}

// Ensure the floating cart is hidden on initial load
document.addEventListener('DOMContentLoaded', () => {
    updateCartUI();
});
