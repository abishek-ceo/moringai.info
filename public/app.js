// ─── STYLES INJECTION ────────────────────────────────────
(function(){
  var style = document.createElement('style');
  style.textContent = [
    '.card-qty-ctrl{display:flex;align-items:center;gap:0;border-radius:50px;overflow:hidden;border:2px solid #2d6a4f;background:#fff;}',
    '.card-qty-ctrl button{width:34px;height:38px;background:#2d6a4f;color:#fff;font-size:18px;font-weight:700;border:none;cursor:pointer;line-height:1;transition:background 0.2s;}',
    '.card-qty-ctrl button:hover{background:#40916c;}',
    '.card-qty-ctrl .cq-num{min-width:34px;text-align:center;font-size:15px;font-weight:700;color:#2d6a4f;font-family:Inter,sans-serif;}'
  ].join('');
  document.head.appendChild(style);
})();

// ─── STATE ────────────────────────────────────────────────
var cart = JSON.parse(localStorage.getItem('moringai_cart') || '[]');
var FREE_SHIPPING_THRESHOLD = 499;

function saveCart() {
  localStorage.setItem('moringai_cart', JSON.stringify(cart));
}

// ─── CARD QTY HELPERS ─────────────────────────────────────
function getCardQty(name, variant) {
  var item = cart.find(function(i){ return i.name === name && i.variant === variant; });
  return item ? item.qty : 0;
}

function getCardPrice(card) {
  var el = card.querySelector('.price-current');
  if (!el) return 0;
  return parseInt(el.textContent.replace(/[^0-9]/g,''), 10) || 0;
}

function getCardEmoji(card) {
  var el = card.querySelector('.product-img');
  return el ? el.textContent.trim() : '🌿';
}

function updateCardButton(name, variant) {
  var qty = getCardQty(name, variant);
  document.querySelectorAll('.product-card').forEach(function(card) {
    if ((card.dataset.name || '') !== name) return;
    var footer = card.querySelector('.product-footer');
    if (!footer) return;
    var btn = footer.querySelector('.add-to-cart, .card-qty-ctrl');
    if (!btn) return;
    var safeN = name.replace(/\\/g,'\\\\').replace(/'/g,"\\'");
    var safeV = variant.replace(/\\/g,'\\\\').replace(/'/g,"\\'");
    var price = getCardPrice(card);
    var emoji = getCardEmoji(card);
    if (qty === 0) {
      btn.outerHTML = '<button class="add-to-cart" onclick="addToCart(\'' + safeN + '\',' + price + ',\'' + emoji + '\',getActiveVariant(this))">🛒 Add</button>';
    } else {
      btn.outerHTML = '<div class="card-qty-ctrl">'+
        '<button onclick="cardDecrement(this,\'' + safeN + '\',\'' + safeV + '\')">−</button>'+
        '<span class="cq-num">' + qty + '</span>'+
        '<button onclick="cardIncrement(this,\'' + safeN + '\',' + price + ',\'' + emoji + '\',\'' + safeV + '\')">+</button>'+
        '</div>';
    }
  });
}

function cardIncrement(btn, name, price, emoji, variant) {
  var item = cart.find(function(i){ return i.name === name && i.variant === variant; });
  if (item) { item.qty += 1; }
  else { cart.push({ name: name, price: price, emoji: emoji, variant: variant, qty: 1 }); }
  saveCart();
  updateCartUI();
  updateCardButton(name, variant);
  showToast('✅ ' + name + ' added!');
}

function cardDecrement(btn, name, variant) {
  var idx = cart.findIndex(function(i){ return i.name === name && i.variant === variant; });
  if (idx === -1) return;
  cart[idx].qty -= 1;
  if (cart[idx].qty <= 0) cart.splice(idx, 1);
  saveCart();
  updateCartUI();
  updateCardButton(name, variant);
}

// ─── CART ─────────────────────────────────────────────────
function addToCart(name, price, emoji, variant) {
  var existing = cart.find(function(i){ return i.name === name && i.variant === variant; });
  if (existing) { existing.qty += 1; }
  else { cart.push({ name: name, price: price, emoji: emoji, variant: variant, qty: 1 }); }
  saveCart();
  updateCartUI();
  updateCardButton(name, variant);
  showToast('✅ ' + name + ' added to cart!');
  var cartBtn = document.querySelector('.cart-btn');
  if (cartBtn) {
    cartBtn.style.transform = 'scale(1.3)';
    setTimeout(function(){ cartBtn.style.transform = ''; }, 300);
  }
}

function removeFromCart(name, variant) {
  cart = cart.filter(function(i){ return !(i.name === name && i.variant === variant); });
  saveCart();
  updateCartUI();
  updateCardButton(name, variant);
}

function changeQty(name, variant, delta) {
  var item = cart.find(function(i){ return i.name === name && i.variant === variant; });
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cart = cart.filter(function(i){ return !(i.name === name && i.variant === variant); });
  saveCart();
  updateCartUI();
  updateCardButton(name, variant);
}

function getCartTotal() {
  return cart.reduce(function(sum, item){ return sum + item.price * item.qty; }, 0);
}

function getCartCount() {
  return cart.reduce(function(sum, item){ return sum + item.qty; }, 0);
}

function updateCartUI() {
  var total = getCartTotal();
  var count = getCartCount();
  var countEl = document.getElementById('cartCount');
  var mobileCountEl = document.getElementById('mobileBuyCartCount');
  if (countEl) countEl.textContent = count;
  if (mobileCountEl) mobileCountEl.textContent = count;

  var pct = Math.min(100, Math.round((total / FREE_SHIPPING_THRESHOLD) * 100));
  var fillEl = document.getElementById('cartProgressFill');
  var progressTextEl = document.getElementById('cartProgressText');
  var noteEl = document.getElementById('cartShippingNote');
  if (fillEl) fillEl.style.width = pct + '%';
  var remaining = FREE_SHIPPING_THRESHOLD - total;
  if (remaining > 0) {
    if (progressTextEl) progressTextEl.textContent = 'Add ₹' + remaining + ' more for FREE shipping!';
    if (noteEl) noteEl.textContent = '🚚 ₹' + remaining + ' away from free shipping';
  } else {
    if (progressTextEl) progressTextEl.textContent = '🎉 Free shipping unlocked!';
    if (noteEl) noteEl.textContent = '🚚 Free shipping applied!';
  }

  var container = document.getElementById('cartItemsContainer');
  var footer = document.getElementById('cartFooter');
  var subtotalEl = document.getElementById('cartSubtotal');
  if (!container || !footer) return;

  if (cart.length === 0) {
    container.innerHTML = '<div class="cart-empty"><span class="cart-empty-icon">🛒</span><p>Your cart is empty.<br>Add some moringa goodness!</p></div>';
    footer.style.display = 'none';
  } else {
    var html = '';
    cart.forEach(function(item) {
      var safeN = item.name.replace(/"/g,'&quot;');
      var safeV = item.variant.replace(/"/g,'&quot;');
      html += '<div class="cart-item">' +
        '<div class="cart-item-img">' + item.emoji + '</div>' +
        '<div class="cart-item-info">' +
          '<div class="cart-item-name">' + item.name + '</div>' +
          '<div class="cart-item-variant">' + item.variant + '</div>' +
          '<div class="cart-item-footer">' +
            '<span class="cart-item-price">₹' + (item.price * item.qty) + '</span>' +
            '<div class="qty-controls">' +
              '<button class="qty-btn" onclick="changeQty(&quot;' + safeN + '&quot;,&quot;' + safeV + '&quot;,-1)">−</button>' +
              '<span class="qty-num">' + item.qty + '</span>' +
              '<button class="qty-btn" onclick="changeQty(&quot;' + safeN + '&quot;,&quot;' + safeV + '&quot;,1)">+</button>' +
            '</div>' +
            '<button class="cart-remove" onclick="removeFromCart(&quot;' + safeN + '&quot;,&quot;' + safeV + '&quot;)" aria-label="Remove">🗑</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    });
    container.innerHTML = html;
    if (subtotalEl) subtotalEl.textContent = '₹' + total;
    footer.style.display = 'block';
  }
}

function toggleCart(forceOpen) {
  var sidebar = document.getElementById('cartSidebar');
  var overlay = document.getElementById('cartOverlay');
  if (!sidebar || !overlay) return;
  var isOpen = sidebar.classList.contains('open');
  if (forceOpen === true || !isOpen) {
    sidebar.classList.add('open');
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  } else {
    sidebar.classList.remove('open');
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }
}

// ─── CHECKOUT ─────────────────────────────────────────────
function openCheckout() {
  if (cart.length === 0) { showToast('⚠️ Your cart is empty!'); return; }
  var sidebar = document.getElementById('cartSidebar');
  var overlay = document.getElementById('cartOverlay');
  if (sidebar) sidebar.classList.remove('open');
  if (overlay) overlay.classList.remove('open');
  document.body.style.overflow = 'hidden';

  var total = getCartTotal();
  var shipping = total >= FREE_SHIPPING_THRESHOLD ? 0 : 49;
  var finalTotal = total + shipping;

  var itemsHtml = cart.map(function(item){
    return '<div class="order-row"><span>' + item.name + ' (' + item.variant + ') x' + item.qty + '</span><span>₹' + (item.price * item.qty) + '</span></div>';
  }).join('');
  var checkoutOrderItems = document.getElementById('checkoutOrderItems');
  var checkoutShipping = document.getElementById('checkoutShipping');
  var checkoutTotal = document.getElementById('checkoutTotal');
  if (checkoutOrderItems) checkoutOrderItems.innerHTML = itemsHtml;
  if (checkoutShipping) checkoutShipping.textContent = shipping === 0 ? 'FREE' : '₹49';
  if (checkoutTotal) checkoutTotal.textContent = '₹' + finalTotal;
  var checkoutOverlay = document.getElementById('checkoutOverlay');
  if (checkoutOverlay) checkoutOverlay.classList.add('open');
}

function closeCheckout() {
  var el = document.getElementById('checkoutOverlay');
  if (el) el.classList.remove('open');
  document.body.style.overflow = '';
}

function selectPayment(radio) {
  document.querySelectorAll('.payment-method').forEach(function(el){ el.classList.remove('selected'); });
  radio.closest('.payment-method').classList.add('selected');
}

function placeOrder(e) {
  e.preventDefault();
  var nameVal = document.getElementById('cfName').value.trim();
  var phone = document.getElementById('cfPhone').value.trim();
  var email = document.getElementById('cfEmail') ? document.getElementById('cfEmail').value.trim() : '';
  var address = document.getElementById('cfAddress') ? document.getElementById('cfAddress').value.trim() : '';
  var city = document.getElementById('cfCity') ? document.getElementById('cfCity').value.trim() : '';
  var pin = document.getElementById('cfPin') ? document.getElementById('cfPin').value.trim() : '';
  var paymentInput = document.querySelector('input[name="payment"]:checked');
  var selectedPayment = paymentInput ? paymentInput.value : 'cod';

  if (!nameVal || !phone) {
    showToast('⚠️ Please fill all required fields');
    return;
  }

  var total = getCartTotal();
  var shipping = total >= FREE_SHIPPING_THRESHOLD ? 0 : 49;
  var finalTotal = total + shipping;

  var orderData = {
    customer: { name: nameVal, phone: phone, email: email, address: address + (city ? ', ' + city : '') + (pin ? ' - ' + pin : '') },
    items: cart.map(function(i){ return { name: i.name, variant: i.variant, qty: i.qty, price: i.price }; }),
    total: finalTotal,
    shipping: shipping,
    paymentMethod: selectedPayment
  };

  if (selectedPayment === 'razorpay') {
    var keyMeta = document.querySelector('meta[name="razorpay-key"]');
    var razorpayKey = keyMeta ? keyMeta.getAttribute('content') : '';
    if (!razorpayKey) {
      showToast('⚠️ Online payments not configured. Please use COD.');
      return;
    }
    var options = {
      key: razorpayKey,
      amount: finalTotal * 100,
      currency: 'INR',
      name: 'Moringai',
      description: 'Pure Murungai Products',
      handler: function(response) {
        orderData.razorpayPaymentId = response.razorpay_payment_id;
        submitOrder(orderData);
      },
      prefill: { name: nameVal, contact: phone, email: email },
      theme: { color: '#2d6a4f' }
    };
    try {
      var rzp = new Razorpay(options);
      rzp.open();
    } catch(err) {
      showToast('⚠️ Payment error. Please try COD.');
    }
  } else {
    submitOrder(orderData);
  }
}

function submitOrder(orderData) {
  var btn = document.querySelector('.btn-place-order');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Placing order...'; }
  fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData)
  })
  .then(function(res){ return res.json(); })
  .then(function(data) {
    closeCheckout();
    cart = []; saveCart(); updateCartUI();
    document.querySelectorAll('.product-card').forEach(function(card){
      var n = card.dataset.name || '';
      var footer = card.querySelector('.product-footer');
      if (!footer) return;
      var ctrl = footer.querySelector('.card-qty-ctrl');
      if (ctrl) {
        var safeN = n.replace(/'/g,"\\'");
        ctrl.outerHTML = '<button class="add-to-cart" onclick="addToCart(\'' + safeN + '\',' + getCardPrice(card) + ',\'' + getCardEmoji(card) + '\',getActiveVariant(this))">🛒 Add</button>';
      }
    });
    var orderId = data.order ? data.order.id : '';
    showToast('🎉 Order placed! ' + (orderId ? 'ID: ' + orderId : "We'll deliver in 2-5 days."));
    if (btn) { btn.disabled = false; btn.textContent = '✅ Place Order'; }
  })
  .catch(function() {
    closeCheckout();
    cart = []; saveCart(); updateCartUI();
    showToast('🎉 Order received! We\'ll contact you on WhatsApp shortly.');
    if (btn) { btn.disabled = false; btn.textContent = '✅ Place Order'; }
  });
}

// ─── FILTER ───────────────────────────────────────────────
function filterProducts(category, btn) {
  document.querySelectorAll('.filter-btn').forEach(function(b){ b.classList.remove('active'); });
  btn.classList.add('active');
  document.querySelectorAll('.product-card').forEach(function(card){
    if (category === 'all' || card.dataset.category === category) {
      card.classList.remove('hidden');
    } else {
      card.classList.add('hidden');
    }
  });
}

// ─── VARIANT ──────────────────────────────────────────────
function selectVariant(btn, variant) {
  var card = btn.closest('.product-card');
  card.querySelectorAll('.variant-btn').forEach(function(b){ b.classList.remove('active'); });
  btn.classList.add('active');
}

function getActiveVariant(addBtn) {
  var card = addBtn.closest && addBtn.closest('.product-card');
  if (!card) return '';
  var active = card.querySelector('.variant-btn.active');
  return active ? active.textContent.trim() : '';
}

// ─── WISHLIST ─────────────────────────────────────────────
function toggleWishlist(btn) {
  var isWished = btn.textContent === '❤️';
  btn.textContent = isWished ? '🤍' : '❤️';
  showToast(isWished ? 'Removed from wishlist' : '❤️ Added to wishlist!');
}

// ─── SEARCH ───────────────────────────────────────────────
function toggleSearch() {
  var wrapper = document.getElementById('searchBarWrapper');
  var isOpen = wrapper.classList.contains('open');
  wrapper.classList.toggle('open');
  if (!isOpen) {
    setTimeout(function(){ document.getElementById('searchInput').focus(); }, 100);
  } else {
    document.getElementById('searchInput').value = '';
    document.getElementById('searchResultsPreview').innerHTML = '';
  }
}

function liveSearch(query) {
  var preview = document.getElementById('searchResultsPreview');
  if (!query.trim()) { preview.innerHTML = ''; return; }
  var matches = [];
  document.querySelectorAll('.product-card').forEach(function(card){
    var name = card.dataset.name || '';
    if (name.toLowerCase().indexOf(query.toLowerCase()) > -1) matches.push(name);
  });
  if (matches.length === 0) {
    preview.innerHTML = '<span style="font-size:13px;color:#aaa">No products found</span>';
  } else {
    preview.innerHTML = matches.map(function(m){
      return '<span class="search-result-chip" onclick="jumpToProduct(\'' + m.replace(/'/g,"\\'") + '\')">' + m + '</span>';
    }).join('');
  }
}

function jumpToProduct(name) {
  document.querySelectorAll('.product-card').forEach(function(card){
    if ((card.dataset.name || '') === name) {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      card.style.outline = '3px solid #2d6a4f';
      setTimeout(function(){ card.style.outline = ''; }, 2000);
    }
  });
  toggleSearch();
}

// ─── MOBILE MENU ──────────────────────────────────────────
function toggleMenu() {
  var menu = document.getElementById('mobileMenu');
  if (menu) menu.classList.toggle('open');
}

document.addEventListener('click', function(e) {
  var menu = document.getElementById('mobileMenu');
  var hamburger = document.querySelector('.hamburger');
  if (menu && menu.classList.contains('open') && hamburger && !menu.contains(e.target) && !hamburger.contains(e.target)) {
    menu.classList.remove('open');
  }
});

// ─── TOAST ────────────────────────────────────────────────
var toastTimer;
function showToast(msg) {
  var toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function(){ toast.classList.remove('show'); }, 3000);
}

// ─── CONTACT FORM ─────────────────────────────────────────
function handleContactForm(e) {
  e.preventDefault();
  showToast('✅ Message sent! We\'ll respond within 24 hours.');
  e.target.reset();
}

// ─── COUNTDOWN TIMERS ─────────────────────────────────────
function startTimers() {
  document.querySelectorAll('.timer-val').forEach(function(el){
    var seconds = parseInt(el.dataset.seconds, 10) || 0;
    var iv = setInterval(function(){
      if (seconds <= 0) { el.textContent = '00:00:00'; clearInterval(iv); return; }
      seconds--;
      var h = Math.floor(seconds / 3600);
      var m = Math.floor((seconds % 3600) / 60);
      var s = seconds % 60;
      el.textContent = String(h).padStart(2,'0')+':'+String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');
    }, 1000);
  });
}

// ─── SCROLL FADE-IN ───────────────────────────────────────
function initFadeIn() {
  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    document.querySelectorAll('.fade-in').forEach(function(el){ observer.observe(el); });
  } else {
    document.querySelectorAll('.fade-in').forEach(function(el){ el.classList.add('visible'); });
  }
}

// ─── NAV ACTIVE ON SCROLL ─────────────────────────────────
function initNavHighlight() {
  var sections = document.querySelectorAll('section[id]');
  window.addEventListener('scroll', function(){
    var scrollY = window.scrollY;
    sections.forEach(function(sec){
      var top = sec.offsetTop - 120;
      var bottom = top + sec.offsetHeight;
      var navLink = document.querySelector('nav a[href="#' + sec.id + '"]');
      if (navLink) {
        if (scrollY >= top && scrollY < bottom) navLink.classList.add('active');
        else navLink.classList.remove('active');
      }
    });
  });
}

// ─── STICKY HEADER SHADOW ─────────────────────────────────
function initHeaderScroll() {
  var header = document.querySelector('header');
  if (!header) return;
  window.addEventListener('scroll', function(){
    if (window.scrollY > 10) header.style.boxShadow = '0 4px 24px rgba(0,0,0,0.12)';
    else header.style.boxShadow = '';
  });
}

// ─── INIT ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function(){
  updateCartUI();
  cart.forEach(function(item){ updateCardButton(item.name, item.variant); });
  initFadeIn();
  startTimers();
  initNavHighlight();
  initHeaderScroll();
});
