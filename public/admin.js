/* Moringai Admin Panel JS */

let TOKEN = localStorage.getItem('moringai_admin_token') || '';
let allOrders = [];
let currentOrderId = null;

// ── INIT ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  if (TOKEN) tryAutoLogin();
});

async function tryAutoLogin() {
  const res = await apiFetch('/api/admin/stats');
  if (res.ok) showApp();
  else { TOKEN = ''; localStorage.removeItem('moringai_admin_token'); }
}

// ── LOGIN ─────────────────────────────────────────────
async function doLogin() {
  const username = document.getElementById('loginUser').value.trim();
  const password = document.getElementById('loginPass').value.trim();
  const errEl    = document.getElementById('loginError');
  errEl.textContent = '';
  if (!username || !password) { errEl.textContent = 'Enter username and password.'; return; }
  const res = await fetch('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  const data = await res.json();
  if (res.ok && data.token) {
    TOKEN = data.token;
    localStorage.setItem('moringai_admin_token', TOKEN);
    showApp();
  } else {
    errEl.textContent = data.error || 'Invalid credentials.';
  }
}

function doLogout() {
  TOKEN = '';
  localStorage.removeItem('moringai_admin_token');
  document.getElementById('app').style.display = 'none';
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('loginUser').value = '';
  document.getElementById('loginPass').value = '';
}

function showApp() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('app').style.display = 'block';
  loadDashboard();
}

// ── NAV ─────────────────────────────────────────────
function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');
  document.getElementById('nav-' + name).classList.add('active');
  if (name === 'orders')   loadOrders();
  if (name === 'product')  loadProduct();
  if (name === 'settings') loadSettings();
}

// ── API HELPER ─────────────────────────────────────
async function apiFetch(url, options = {}) {
  return fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + TOKEN, ...(options.headers || {}) }
  });
}

// ── DASHBOARD ─────────────────────────────────────
async function loadDashboard() {
  const [statsRes, ordersRes] = await Promise.all([
    apiFetch('/api/admin/stats'),
    apiFetch('/api/admin/orders')
  ]);
  const stats  = await statsRes.json();
  const orders = await ordersRes.json();
  allOrders = orders;

  document.getElementById('statsGrid').innerHTML = `
    <div class="stat-card green">
      <div class="stat-icon">📦</div>
      <div class="stat-val">${stats.totalOrders || 0}</div>
      <div class="stat-label">Total Orders</div>
    </div>
    <div class="stat-card gold">
      <div class="stat-icon">💰</div>
      <div class="stat-val">₹${(stats.totalRevenue || 0).toLocaleString('en-IN')}</div>
      <div class="stat-label">Total Revenue</div>
    </div>
    <div class="stat-card red">
      <div class="stat-icon">⏳</div>
      <div class="stat-val">${stats.pending || 0}</div>
      <div class="stat-label">Pending Orders</div>
    </div>
    <div class="stat-card blue">
      <div class="stat-icon">🚚</div>
      <div class="stat-val">${stats.shipped || 0}</div>
      <div class="stat-label">Shipped Orders</div>
    </div>
  `;

  const recent = orders.slice(0, 8);
  document.getElementById('recentOrdersTable').innerHTML = recent.length
    ? renderOrdersTable(recent, true)
    : '<div class="empty-state"><span class="empty-icon">📭</span><p>No orders yet</p></div>';
}

// ── ORDERS ─────────────────────────────────────────
async function loadOrders() {
  document.getElementById('ordersTable').innerHTML = '<div class="loading">Loading...</div>';
  const res  = await apiFetch('/api/admin/orders');
  const data = await res.json();
  allOrders  = data;
  renderFilteredOrders();
}

function filterOrders() { renderFilteredOrders(); }

function renderFilteredOrders() {
  const q      = (document.getElementById('orderSearch')?.value || '').toLowerCase();
  const status = document.getElementById('orderFilter')?.value || '';
  const filtered = allOrders.filter(o => {
    const matchStatus = !status || o.status === status;
    const matchQ = !q || o.id.toLowerCase().includes(q) ||
      o.customer.toLowerCase().includes(q) ||
      (o.phone || '').toLowerCase().includes(q) ||
      (o.city || '').toLowerCase().includes(q);
    return matchStatus && matchQ;
  });
  const el = document.getElementById('ordersTable');
  if (!el) return;
  el.innerHTML = filtered.length
    ? renderOrdersTable(filtered, false)
    : '<div class="empty-state"><span class="empty-icon">🔍</span><p>No orders match your search</p></div>';
}

function renderOrdersTable(orders, compact) {
  return `
    <table>
      <thead><tr>
        <th>Order ID</th>
        <th>Customer</th>
        <th>Phone</th>
        <th>City</th>
        <th>Total</th>
        <th>Payment</th>
        <th>Status</th>
        <th>Date</th>
        <th>Actions</th>
      </tr></thead>
      <tbody>
        ${orders.map(o => `
          <tr>
            <td><code style="font-size:12px;color:var(--green)">${o.id}</code></td>
            <td><strong>${esc(o.customer)}</strong></td>
            <td>${esc(o.phone)}</td>
            <td>${esc(o.city)}</td>
            <td style="font-weight:700;color:var(--green)">₹${o.total.toLocaleString('en-IN')}</td>
            <td>${(o.payment?.method || 'cod').toUpperCase()}</td>
            <td><span class="status-badge status-${o.status}">${o.status}</span></td>
            <td style="font-size:12px;color:var(--muted)">${fmtDate(o.createdAt)}</td>
            <td>
              <button class="action-btn btn-view" onclick="viewOrder('${o.id}')">👁 View</button>
              ${!compact ? `<button class="action-btn btn-ship" onclick="quickShip('${o.id}')">🚚 Ship</button>` : ''}
              ${!compact ? `<button class="action-btn btn-del" onclick="deleteOrder('${o.id}')">🗑</button>` : ''}
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

async function quickShip(id) {
  if (!confirm('Mark order ' + id + ' as shipped?')) return;
  const res = await apiFetch('/api/admin/orders/' + id, {
    method: 'PATCH', body: JSON.stringify({ status: 'shipped' })
  });
  if (res.ok) { showToast('🚚 Order marked as shipped!', 'success'); loadOrders(); }
  else showToast('Error updating order', 'error');
}

async function deleteOrder(id) {
  if (!confirm('Delete order ' + id + '? This cannot be undone.')) return;
  const res = await apiFetch('/api/admin/orders/' + id, { method: 'DELETE' });
  if (res.ok) { showToast('🗑 Order deleted', 'success'); loadOrders(); loadDashboard(); }
  else showToast('Error deleting order', 'error');
}

function viewOrder(id) {
  const o = allOrders.find(x => x.id === id);
  if (!o) return;
  currentOrderId = id;
  document.getElementById('modalOrderId').textContent = '📦 ' + o.id;
  document.getElementById('modalBody').innerHTML = `
    <div class="detail-row"><span>Customer</span><span>${esc(o.customer)}</span></div>
    <div class="detail-row"><span>Phone</span><span>${esc(o.phone)}</span></div>
    ${o.email ? `<div class="detail-row"><span>Email</span><span>${esc(o.email)}</span></div>` : ''}
    <div class="detail-row"><span>Address</span><span>${esc(o.address)}, ${esc(o.city)}</span></div>
    <div class="detail-row"><span>Items</span><span>${o.items.map(i => i.name + ' × ' + i.qty).join(', ')}</span></div>
    <div class="detail-row"><span>Total</span><span style="color:var(--green);font-size:18px">₹${o.total.toLocaleString('en-IN')}</span></div>
    <div class="detail-row"><span>Payment</span><span>${(o.payment?.method || 'cod').toUpperCase()}</span></div>
    <div class="detail-row"><span>Status</span><span><span class="status-badge status-${o.status}">${o.status}</span></span></div>
    <div class="detail-row"><span>Ordered At</span><span>${fmtDate(o.createdAt)}</span></div>
  `;
  document.getElementById('modalStatusSelect').value = o.status;
  document.getElementById('orderModal').classList.add('open');
}

function closeModal() {
  document.getElementById('orderModal').classList.remove('open');
  currentOrderId = null;
}

async function updateModalStatus() {
  const status = document.getElementById('modalStatusSelect').value;
  const res = await apiFetch('/api/admin/orders/' + currentOrderId, {
    method: 'PATCH', body: JSON.stringify({ status })
  });
  if (res.ok) {
    showToast('✅ Status updated to ' + status, 'success');
    closeModal();
    loadOrders();
    loadDashboard();
  } else showToast('Error updating status', 'error');
}

// ── PRODUCT ─────────────────────────────────────────
async function loadProduct() {
  const res  = await apiFetch('/api/product');
  const data = await res.json();
  document.getElementById('productForm').innerHTML = `
    <div class="form-group">
      <label>Product Name</label>
      <input type="text" id="pName" value="${esc(data.name || '')}">
    </div>
    <div class="form-group">
      <label>Price (₹)</label>
      <input type="number" id="pPrice" value="${data.price || ''}">
    </div>
    <div class="form-group">
      <label>Original Price (₹)</label>
      <input type="number" id="pOrigPrice" value="${data.originalPrice || ''}">
    </div>
    <div class="form-group">
      <label>Weight / Unit</label>
      <input type="text" id="pWeight" value="${esc(data.weight || '')}">
    </div>
    <div class="form-group full">
      <label>Description</label>
      <textarea id="pDesc">${esc(data.description || '')}</textarea>
    </div>
  `;
}

async function saveProduct() {
  const body = {
    name:          document.getElementById('pName').value,
    price:         Number(document.getElementById('pPrice').value),
    originalPrice: Number(document.getElementById('pOrigPrice').value),
    weight:        document.getElementById('pWeight').value,
    description:   document.getElementById('pDesc').value,
  };
  const res = await apiFetch('/api/admin/product', { method: 'PUT', body: JSON.stringify(body) });
  if (res.ok) showToast('💾 Product saved!', 'success');
  else showToast('Error saving product', 'error');
}

// ── SETTINGS ────────────────────────────────────────
async function loadSettings() {
  const res  = await apiFetch('/api/settings');
  const data = await res.json();
  document.getElementById('settingsForm').innerHTML = `
    <div class="form-group">
      <label>Store Name</label>
      <input type="text" id="sName" value="${esc(data.storeName || 'Moringai')}">
    </div>
    <div class="form-group">
      <label>Free Shipping Above (₹)</label>
      <input type="number" id="sFreeShipping" value="${data.freeShippingAbove || 499}">
    </div>
    <div class="form-group">
      <label>Shipping Charge (₹)</label>
      <input type="number" id="sShipping" value="${data.shippingCharge || 60}">
    </div>
    <div class="form-group">
      <label>WhatsApp Number</label>
      <input type="text" id="sWhatsapp" value="${esc(data.whatsapp || '')}">
    </div>
    <div class="form-group">
      <label>Announcement Bar Text</label>
      <input type="text" id="sAnnouncement" value="${esc(data.announcement || '')}">
    </div>
    <div class="form-group">
      <label>Coupon Code</label>
      <input type="text" id="sCoupon" value="${esc(data.couponCode || '')}">
    </div>
    <div class="form-group">
      <label>Coupon Discount (%)</label>
      <input type="number" id="sCouponDiscount" value="${data.couponDiscount || 10}">
    </div>
    <div class="form-group">
      <label>Orders Email</label>
      <input type="email" id="sEmail" value="${esc(data.email || '')}">
    </div>
  `;
}

async function saveSettings() {
  const body = {
    storeName:          document.getElementById('sName').value,
    freeShippingAbove:  Number(document.getElementById('sFreeShipping').value),
    shippingCharge:     Number(document.getElementById('sShipping').value),
    whatsapp:           document.getElementById('sWhatsapp').value,
    announcement:       document.getElementById('sAnnouncement').value,
    couponCode:         document.getElementById('sCoupon').value,
    couponDiscount:     Number(document.getElementById('sCouponDiscount').value),
    email:              document.getElementById('sEmail').value,
  };
  const res = await apiFetch('/api/admin/settings', { method: 'PUT', body: JSON.stringify(body) });
  if (res.ok) showToast('💾 Settings saved!', 'success');
  else showToast('Error saving settings', 'error');
}

// ── HELPERS ──────────────────────────────────────────
function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function fmtDate(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) +
    ' ' + d.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' });
}

let toastTimer;
function showToast(msg, type = '') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'toast show ' + type;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.className = 'toast'; }, 3000);
}

// Close modal on overlay click
document.getElementById('orderModal')?.addEventListener('click', function(e) {
  if (e.target === this) closeModal();
});
