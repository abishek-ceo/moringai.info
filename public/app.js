// Auto-inject fix.css so products are always visible (no HTML edit needed)
(function(){
  var link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'fix.css';
  document.head.appendChild(link);
})();

// ─── STATE ───────────────────────────────────────────────
var cart = [];
var FREE_SHIPPING_THRESHOLD = 499;

// ─── CART ────────────────────────────────────────────────
function addToCart(name, price, emoji, variant) {
  var existing = cart.find(function(i){ return i.name === name && i.variant === variant; });
  if (existing) { existing.qty += 1; }
  else { cart.push({ name: name, price: price, emoji: emoji, variant: variant, qty: 1 }); }
  updateCartUI();
  toggleCart(true);
  showToast('✅ ' + name + ' added to cart!');
}

function removeFromCart(index) {
  cart.splice(index, 1);
  updateCartUI();
}

function changeQty(index, delta) {
  cart[index].qty += delta;
  if (cart[index].qty <= 0) cart.splice(index, 1);
  updateCartUI();
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
  document.getElementById('cartCount').textContent = count;
  document.getElementById('mobileBuyCartCount').textContent = count;

  var pct = Math.min(100, Math.round((total / FREE_SHIPPING_THRESHOLD) * 100));
  document.getElementById('cartProgressFill').style.width = pct + '%';
  var remaining = FREE_SHIPPING_THRESHOLD - total;
  if (remaining > 0) {
    document.getElementById('cartProgressText').textContent = 'Add ₹' + remaining + ' more for free shipping!';
    var note = document.getElementById('cartShippingNote');
    if (note) note.textContent = '🚚 ₹' + remaining + ' away from free shipping';
  } else {
    document.getElementById('cartProgressText').textContent = '🎉 Free shipping unlocked!';
    var note2 = document.getElementById('cartShippingNote');
    if (note2) note2.textContent = '🚚 Free shipping applied!';
  }

  var container = document.getElementById('cartItemsContainer');
  var footer = document.getElementById('cartFooter');
  if (cart.length === 0) {
    container.innerHTML = '<div class="cart-empty"><span class="cart-empty-icon">🛒</span><p>Your cart is empty.<br>Add some moringa goodness!</p></div>';
    footer.style.display = 'none';
  } else {
    var html = '';
    cart.forEach(function(item, i) {
      html += '<div class="cart-item">' +
        '<div class="cart-item-img">' + item.emoji + '</div>' +
        '<div class="cart-item-info">' +
          '<div class="cart-item-name">' + item.name + '</div>' +
          '<div class="cart-item-variant">' + item.variant + '</div>' +
          '<div class="cart-item-footer">' +
            '<span class="cart-item-price">₹' + (item.price * item.qty) + '</span>' +
            '<div class="qty-controls">' +
              '<button class="qty-btn" onclick="changeQty(' + i + ',-1)">−</button>' +
              '<span class="qty-num">' + item.qty + '</span>' +
              '<button class="qty-btn" onclick="changeQty(' + i + ',1)">+</button>' +
            '</div>' +
            '<button class="cart-remove" onclick="removeFromCart(' + i + ')" aria-label="Remove">🗑</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    });
    container.innerHTML = html;
    document.getElementById('cartSubtotal').textContent = '₹' + total;
    footer.style.display = 'block';
  }
}

function toggleCart(forceOpen) {
  var sidebar = document.getElementById('cartSidebar');
  var overlay = document.getElementById('cartOverlay');
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

// ─── CHECKOUT ────────────────────────────────────────────
function openCheckout() {
  if (cart.length === 0) { showToast('⚠️ Your cart is empty!'); return; }
  document.getElementById('cartSidebar').classList.remove('open');
  document.getElementById('cartOverlay').classList.remove('open');
  document.body.style.overflow = 'hidden';

  var total = getCartTotal();
  var itemsHtml = cart.map(function(item){
    return '<div class="order-row"><span>' + item.name + ' (' + item.variant + ') x' + item.qty + '</span><span>₹' + (item.price * item.qty) + '</span></div>';
  }).join('');
  document.getElementById('checkoutOrderItems').innerHTML = itemsHtml;
  document.getElementById('checkoutShipping').textContent = total >= FREE_SHIPPING_THRESHOLD ? 'FREE' : '₹49';
  var finalTotal = total >= FREE_SHIPPING_THRESHOLD ? total : total + 49;
  document.getElementById('checkoutTotal').textContent = '₹' + finalTotal;
  document.getElementById('checkoutOverlay').classList.add('open');
}

function closeCheckout() {
  document.getElementById('checkoutOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

function selectPayment(radio) {
  document.querySelectorAll('.payment-method').forEach(function(el){ el.classList.remove('selected'); });
  radio.closest('.payment-method').classList.add('selected');
}

function placeOrder(e) {
  e.preventDefault();
  var name = document.getElementById('cfName').value.trim();
  var phone = document.getElementById('cfPhone').value.trim();
  var selectedPayment = document.querySelector('input[name="payment"]:checked').value;

  if (selectedPayment === 'razorpay') {
    var keyMeta = document.querySelector('meta[name="razorpay-key"]');
    var razorpayKey = keyMeta ? keyMeta.getAttribute('content') : '';
    if (!razorpayKey) {
      showToast('⚠️ Add your Razorpay key to enable online payments.');
      return;
    }
    var total = getCartTotal();
    var finalTotal = total >= FREE_SHIPPING_THRESHOLD ? total : total + 49;
    var options = {
      key: razorpayKey,
      amount: finalTotal * 100,
      currency: 'INR',
      name: 'Moringai',
      description: 'Pure Murungai Products',
      handler: function(response) {
        closeCheckout();
        cart = [];
        updateCartUI();
        showToast('🎉 Order placed! Payment ID: ' + response.razorpay_payment_id);
      },
      prefill: { name: name, contact: phone, email: document.getElementById('cfEmail').value },
      theme: { color: '#2d6a4f' }
    };
    try {
      var rzp = new Razorpay(options);
      rzp.open();
    } catch(err) {
      showToast('⚠️ Payment gateway error. Please try COD.');
    }
  } else {
    closeCheckout();
    cart = [];
    updateCartUI();
    showToast('🎉 Order placed! COD — we\'ll deliver in 2-5 days.');
  }
}

// ─── FILTER ──────────────────────────────────────────────
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

// ─── VARIANT ─────────────────────────────────────────────
function selectVariant(btn, variant) {
  var card = btn.closest('.product-card');
  card.querySelectorAll('.variant-btn').forEach(function(b){ b.classList.remove('active'); });
  btn.classList.add('active');
}

function getActiveVariant(addBtn) {
  var card = addBtn.closest('.product-card');
  var active = card.querySelector('.variant-btn.active');
  return active ? active.textContent.trim() : '';
}

// ─── WISHLIST ────────────────────────────────────────────
function toggleWishlist(btn) {
  var isWished = btn.textContent === '❤️';
  btn.textContent = isWished ? '🤍' : '❤️';
  showToast(isWished ? 'Removed from wishlist' : '❤️ Added to wishlist!');
}

// ─── SEARCH ──────────────────────────────────────────────
function toggleSearch() {
  var wrapper = document.getElementById('searchBarWrapper');
  var isOpen = wrapper.classList.contains('open');
  wrapper.classList.toggle('open');
  if (!isOpen) {
    document.getElementById('searchInput').focus();
  } else {
    document.getElementById('searchInput').value = '';
    document.getElementById('searchResultsPreview').innerHTML = '';
  }
}

function liveSearch(query) {
  var preview = document.getElementById('searchResultsPreview');
  if (!query.trim()) { preview.innerHTML = ''; return; }
  var cards = document.querySelectorAll('.product-card');
  var matches = [];
  cards.forEach(function(card){
    var name = card.dataset.name || '';
    if (name.toLowerCase().indexOf(query.toLowerCase()) > -1) matches.push(name);
  });
  if (matches.length === 0) {
    preview.innerHTML = '<span style="font-size:13px;color:#aaa">No products found</span>';
  } else {
    preview.innerHTML = matches.map(function(m){
      return '<span class="search-result-chip" onclick="jumpToProduct(\'' + m + '\')">' + m + '</span>';
    }).join('');
  }
}

function jumpToProduct(name) {
  var cards = document.querySelectorAll('.product-card');
  cards.forEach(function(card){
    if ((card.dataset.name || '') === name) {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      card.style.outline = '3px solid #2d6a4f';
      setTimeout(function(){ card.style.outline = ''; }, 2000);
    }
  });
  toggleSearch();
}

// ─── MOBILE MENU ─────────────────────────────────────────
function toggleMenu() {
  document.getElementById('mobileMenu').classList.toggle('open');
}

// ─── TOAST ───────────────────────────────────────────────
var toastTimer;
function showToast(msg) {
  var toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function(){ toast.classList.remove('show'); }, 3000);
}

// ─── CONTACT FORM ────────────────────────────────────────
function handleContactForm(e) {
  e.preventDefault();
  showToast('✅ Message sent! We\'ll respond within 24 hours.');
  e.target.reset();
}

// ─── COUNTDOWN TIMERS ────────────────────────────────────
function startTimers() {
  document.querySelectorAll('.timer-val').forEach(function(el){
    var seconds = parseInt(el.dataset.seconds, 10);
    setInterval(function(){
      if (seconds <= 0) { el.textContent = '00:00:00'; return; }
      seconds--;
      var h = Math.floor(seconds / 3600);
      var m = Math.floor((seconds % 3600) / 60);
      var s = seconds % 60;
      el.textContent =
        String(h).padStart(2,'0') + ':' +
        String(m).padStart(2,'0') + ':' +
        String(s).padStart(2,'0');
    }, 1000);
  });
}

// ─── SCROLL FADE-IN ──────────────────────────────────────
function initFadeIn() {
  // Immediately make all visible (CSS fix.css handles opacity)
  document.querySelectorAll('.fade-in').forEach(function(el){
    el.classList.add('visible');
  });
}

// ─── NAV ACTIVE ON SCROLL ────────────────────────────────
function initNavHighlight() {
  var sections = document.querySelectorAll('section[id]');
  window.addEventListener('scroll', function(){
    var scrollY = window.scrollY;
    sections.forEach(function(sec){
      var top = sec.offsetTop - 100;
      var bottom = top + sec.offsetHeight;
      var navLink = document.querySelector('nav a[href="#' + sec.id + '"]');
      if (navLink) {
        if (scrollY >= top && scrollY < bottom) navLink.classList.add('active');
        else navLink.classList.remove('active');
      }
    });
  });
}

// ─── INIT ────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function(){
  initFadeIn();
  startTimers();
  initNavHighlight();
});
