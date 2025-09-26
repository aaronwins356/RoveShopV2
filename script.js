/*
  ROVE storefront script

  This client‑side script powers the multi‑page ROVE storefront. It loads
  product data from products.json, populates the shop grid, renders
  individual product detail pages, manages a persistent shopping cart using
  localStorage, and assembles a dropshipping order payload on checkout. It
  also handles simple newsletter subscription interactions.

  Global functions:
  - updateCartCount: refreshes the cart badge across pages
  - getProducts: fetches products.json and caches the result
  - getCart/saveCart: helpers for localStorage persistence
  - addToCart/removeFromCart: modifications to the cart
  - loadProducts: renders all products on the shop page
  - loadProductDetail: populates the product detail page based on URL
  - renderCart: builds the cart table and total on the cart page
  - checkout: demonstrates a dropshipping order payload
  - sendOrderToSupplier: placeholder integration for Wohu Optical
*/

document.addEventListener('DOMContentLoaded', () => {
  updateCartCount();
  // Handle newsletter form submissions globally
  const newsletterForm = document.getElementById('newsletter-form');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', evt => {
      evt.preventDefault();
      const input = newsletterForm.querySelector('input[type=email]');
      if (input && input.value) {
        alert(`Thanks for subscribing${input.value ? ", " + input.value : ""}!`);
        input.value = '';
      }
    });
  }
  const page = document.body.dataset.page;
  if (page === 'shop') {
    loadProducts();
  } else if (page === 'product') {
    loadProductDetail();
  } else if (page === 'cart') {
    renderCart();
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) checkoutBtn.addEventListener('click', checkout);
  }
});

// Cached products data
let productsCache = null;

async function getProducts() {
  if (productsCache) return productsCache;
  try {
    const res = await fetch('products.json');
    productsCache = await res.json();
    return productsCache;
  } catch (err) {
    console.error('Failed to load products:', err);
    return [];
  }
}

function getCart() {
  const raw = localStorage.getItem('rove_cart_v2');
  return raw ? JSON.parse(raw) : [];
}

function saveCart(cart) {
  localStorage.setItem('rove_cart_v2', JSON.stringify(cart));
}

function updateCartCount() {
  const cart = getCart();
  const count = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const badge = document.getElementById('cart-count');
  if (badge) badge.textContent = count;
}

function addToCart(item) {
  const cart = getCart();
  // Attempt to find existing item by SKU and colour
  const existing = cart.find(c => c.sku === item.sku && c.color === item.color);
  if (existing) {
    existing.quantity += item.quantity;
  } else {
    cart.push(item);
  }
  saveCart(cart);
  updateCartCount();
  alert(`${item.name} added to cart.`);
}

function removeFromCart(index) {
  const cart = getCart();
  cart.splice(index, 1);
  saveCart(cart);
  renderCart();
  updateCartCount();
}

async function loadProducts() {
  const products = await getProducts();
  const grid = document.getElementById('product-grid');
  if (!grid) return;
  grid.innerHTML = '';
  products.forEach(product => {
    const card = document.createElement('div');
    card.className = 'product-card';
    // Build product card HTML
    card.innerHTML = `
      <svg class="product-icon" viewBox="0 0 576 512" aria-hidden="true">
        <path d="M118.6 80c-11.5 0-21.4 7.9-24 19.1L57 260.3c20.5-6.2 48.3-12.3 78.7-12.3c32.3 0 61.8 6.9 82.8 13.5c10.6 3.3 19.3 6.7 25.4 9.2c3.1 1.3 5.5 2.4 7.3 3.2c.9 .4 1.6 .7 2.1 1l.6 .3 .2 .1c0 0 .1 0 .1 0c0 0 0 0 0 0s0 0 0 0L247.9 288s0 0 0 0l6.3-12.7c5.8 2.9 10.4 7.3 13.5 12.7l40.6 0c3.1-5.3 7.7-9.8 13.5-12.7l6.3 12.7s0 0 0 0c-6.3-12.7-6.3-12.7-6.3-12.7s0 0 0 0s0 0 0 0c0 0 .1 0 .1 0l.2-.1 .6-.3c.5-.2 1.2-.6 2.1-1c1.8-.8 4.2-1.9 7.3-3.2c6.1-2.6 14.8-5.9 25.4-9.2c21-6.6 50.4-13.5 82.8-13.5c30.4 0 58.2 6.1 78.7 12.3L481.4 99.1c-2.6-11.2-12.6-19.1-24-19.1c-3.1 0-6.2 .6-9.2 1.8L416.9 94.3c-12.3 4.9-26.3-1.1-31.2-13.4s1.1-26.3 13.4-31.2l31.3-12.5c8.6-3.4 17.7-5.2 27-5.2c33.8 0 63.1 23.3 70.8 56.2l43.9 188c1.7 7.3 2.9 14.7 3.5 22.1c.3 1.9 .5 3.8 .5 5.7l0 6.7 0 41.3 0 16c0 61.9-50.1 112-112 112l-44.3 0c-59.4 0-108.5-46.4-111.8-105.8L306.6 352l-37.2 0-1.2 22.2C264.9 433.6 215.8 480 156.3 480L112 480C50.1 480 0 429.9 0 368l0-16 0-41.3L0 304c0-1.9 .2-3.8 .5-5.7c.6-7.4 1.8-14.8 3.5-22.1l43.9-188C55.5 55.3 84.8 32 118.6 32c9.2 0 18.4 1.8 27 5.2l31.3 12.5c12.3 4.9 18.3 18.9 13.4 31.2s-18.9 18.3-31.2 13.4L127.8 81.8c-2.9-1.2-6-1.8-9.2-1.8zM64 325.4L64 368c0 26.5 21.5 48 48 48l44.3 0c25.5 0 46.5-19.9 47.9-45.3l2.5-45.6c-2.3-.8-4.9-1.7-7.5-2.5c-17.2-5.4-39.9-10.5-63.6-10.5c-23.7 0-46.2 5.1-63.2 10.5c-3.1 1-5.9 1.9-8.5 2.9zM512 368l0-42.6c-2.6-.9-5.5-1.9-8.5-2.9c-17-5.4-39.5-10.5-63.2-10.5c-23.7 0-46.4 5.1-63.6 10.5c-2.7 .8-5.2 1.7-7.5 2.5l2.5 45.6c1.4 25.4 22.5 45.3 47.9 45.3l44.3 0c26.5 0 48-21.5 48-48z" />
      </svg>
      <div class="product-name">${product.name}</div>
      <div class="product-price">$${product.price.toFixed(2)}</div>
      <div class="product-colors">Colour${product.colors.length > 1 ? 's' : ''}: ${product.colors.join(', ')}</div>
      <div class="product-buttons">
        <a href="product.html?sku=${encodeURIComponent(product.sku)}" class="btn-primary">View Details</a>
        <button class="btn-add" data-sku="${product.sku}">Add to Cart</button>
      </div>
    `;
    // Attach event handler to Add to Cart button
    const btn = card.querySelector('.btn-add');
    btn.addEventListener('click', () => {
      addToCart({
        sku: product.sku,
        name: product.name,
        price: product.price,
        color: product.colors[0],
        quantity: 1
      });
    });
    grid.appendChild(card);
  });
}

async function loadProductDetail() {
  const params = new URLSearchParams(window.location.search);
  const sku = params.get('sku');
  if (!sku) {
    return;
  }
  const products = await getProducts();
  const product = products.find(p => p.sku === sku);
  const container = document.getElementById('product-details');
  if (!container) return;
  if (!product) {
    container.innerHTML = `<p>Product not found.</p>`;
    return;
  }
  // Create markup for product detail
  const detail = document.createElement('div');
  detail.className = 'product-details-container';
  detail.innerHTML = `
    <div class="product-image-container">
      <img id="product-image" src="${product.image || 'product-reference.png'}" alt="${product.name}">
    </div>
    <div class="product-info">
      <h1 id="product-name">${product.name}</h1>
      <div class="product-price" id="product-price">$${product.price.toFixed(2)}</div>
      <p class="product-description" id="product-description">${product.description}</p>
      <ul class="product-features" id="product-features">
        <!-- We could list features here if provided -->
      </ul>
      <div class="product-variants">
        <label for="color-select">Colour:</label>
        <select id="color-select"></select>
        <label for="quantity">Qty:</label>
        <input type="number" id="quantity" value="1" min="1">
      </div>
      <button id="add-to-cart-detail" class="btn-primary">Add to Cart</button>
      <div class="product-meta">
        <div>Weight: <span id="product-weight">${product.weight}</span> g</div>
        <div>Dimensions: <span id="product-dimensions">${product.dimensions}</span></div>
        <div>Colours: <span id="product-colors-list">${product.colors.join(', ')}</span></div>
        <div>Tags: <span id="product-tags">${product.tags.join(', ')}</span></div>
      </div>
    </div>
  `;
  container.appendChild(detail);
  // Populate colour options
  const colourSelect = document.getElementById('color-select');
  product.colors.forEach(col => {
    const option = document.createElement('option');
    option.value = col;
    option.textContent = col;
    colourSelect.appendChild(option);
  });
  // Add event listener to Add to Cart button
  const addBtn = document.getElementById('add-to-cart-detail');
  addBtn.addEventListener('click', () => {
    const selectedColour = document.getElementById('color-select').value;
    const qty = parseInt(document.getElementById('quantity').value) || 1;
    addToCart({
      sku: product.sku,
      name: product.name,
      price: product.price,
      color: selectedColour,
      quantity: qty
    });
  });
}

function renderCart() {
  const cart = getCart();
  const tbody = document.getElementById('cart-items');
  if (!tbody) return;
  tbody.innerHTML = '';
  let total = 0;
  cart.forEach((item, index) => {
    const subtotal = item.price * item.quantity;
    total += subtotal;
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${item.name}</td>
      <td>${item.color}</td>
      <td>$${item.price.toFixed(2)}</td>
      <td>${item.quantity}</td>
      <td>$${subtotal.toFixed(2)}</td>
      <td><button class="cart-remove" data-index="${index}">Remove</button></td>
    `;
    tbody.appendChild(row);
  });
  // Attach remove handlers
  const removeButtons = tbody.querySelectorAll('.cart-remove');
  removeButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = parseInt(e.target.getAttribute('data-index'));
      removeFromCart(idx);
    });
  });
  // Update total
  const totalEl = document.getElementById('cart-total');
  if (totalEl) totalEl.textContent = total.toFixed(2);
}

function checkout() {
  const cart = getCart();
  if (!cart.length) {
    alert('Your cart is empty. Please add some products first.');
    return;
  }
  const orderId = `RV-${Date.now()}`;
  const lineItems = cart.map(item => ({ sku: item.sku, colour: item.color, quantity: item.quantity }));
  const payload = {
    orderId,
    lineItems,
    customer: {
      name: 'Customer Name',
      email: 'customer@example.com',
      address: '123 Main St, Caldwell, TX'
    }
  };
  sendOrderToSupplier(payload);
  // Reset cart
  saveCart([]);
  updateCartCount();
  alert('Thank you for your purchase! Your order has been placed.');
  // Redirect to home
  window.location.href = 'index.html';
}

function sendOrderToSupplier(payload) {
  /*
    Placeholder function for integrating with Wohu Optical or another
    dropshipping service. In a production implementation you would
    authenticate and make an API request here according to the supplier’s
    specification. See the Wohu dropshipping agreement for further
    details.
  */
  console.log('Dropshipping payload prepared:', payload);
}