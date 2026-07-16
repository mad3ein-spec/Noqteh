const API_BASE = '/api';
let token = localStorage.getItem('noqteh_admin_token');
let currentUser = null;
let products = [];
let orders = [];
let users = [];
let categories = [];

async function api(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    ...options
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'خطا در ارتباط با سرور');
  return data;
}

function formatMoney(n) {
  return Number(n || 0).toLocaleString('fa-IR');
}

function formatDate(d) {
  return new Date(d).toLocaleString('fa-IR', { dateStyle: 'short', timeStyle: 'short' });
}

function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  document.getElementById(`${name}-page`).classList.remove('hidden');
  document.querySelectorAll('.sidebar nav a').forEach(a => a.classList.toggle('active', a.dataset.page === name));
  document.getElementById('page-title').textContent = name === 'dashboard' ? 'داشبورد' :
    name === 'products' ? 'مدیریت محصولات' :
    name === 'orders' ? 'مدیریت سفارشات' :
    name === 'users' ? 'مدیریت کاربران' : 'تنظیمات';
}

// Login
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  try {
    const data = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: form.email.value, password: form.password.value })
    });
    if (!data.user.isAdmin) throw new Error('دسترسی مدیریت ندارید');
    token = data.token;
    localStorage.setItem('noqteh_admin_token', token);
    currentUser = data.user;
    initApp();
  } catch (err) {
    document.getElementById('login-error').textContent = err.message;
  }
});

document.getElementById('logout-btn').addEventListener('click', () => {
  localStorage.removeItem('noqteh_admin_token');
  location.reload();
});

async function initApp() {
  try {
    const me = await api('/auth/me');
    if (!me.user.isAdmin) throw new Error('دسترسی مدیریت ندارید');
    currentUser = me.user;
  } catch {
    localStorage.removeItem('noqteh_admin_token');
    return;
  }

  document.getElementById('login-page').classList.add('hidden');
  document.getElementById('admin-layout').classList.remove('hidden');
  document.getElementById('admin-name').textContent = currentUser.firstName || currentUser.email;

  document.querySelectorAll('.sidebar nav a').forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      showPage(a.dataset.page);
      history.pushState(null, '', `#${a.dataset.page}`);
      loadPageData(a.dataset.page);
    });
  });

  window.addEventListener('popstate', () => {
    const page = location.hash.slice(1) || 'dashboard';
    showPage(page);
    loadPageData(page);
  });

  const initialPage = location.hash.slice(1) || 'dashboard';
  showPage(initialPage);
  await loadPageData(initialPage);
}

async function loadPageData(page) {
  if (page === 'dashboard') await loadDashboard();
  if (page === 'products') await loadProducts();
  if (page === 'orders') await loadOrders();
  if (page === 'users') await loadUsers();
  if (page === 'settings') await loadSettings();
}

async function loadDashboard() {
  const data = await api('/admin/dashboard');
  document.getElementById('stat-orders').textContent = formatMoney(data.data.stats.totalOrders);
  document.getElementById('stat-revenue').textContent = formatMoney(data.data.stats.totalRevenue);
  document.getElementById('stat-products').textContent = formatMoney(data.data.stats.totalProducts);
  document.getElementById('stat-users').textContent = formatMoney(data.data.stats.totalUsers);
  document.getElementById('stat-pending').textContent = formatMoney(data.data.stats.pendingOrders);

  const tbody = document.getElementById('recent-orders');
  tbody.innerHTML = data.data.recentOrders.map(o => `
    <tr>
      <td>${o.order_number}</td>
      <td>${formatMoney(o.total)} تومان</td>
      <td>${o.status}</td>
      <td><span class="badge badge-${o.payment_status === 'paid' ? 'paid' : 'unpaid'}">${o.payment_status === 'paid' ? 'پرداخت شده' : 'پرداخت نشده'}</span></td>
      <td>${formatDate(o.created_at)}</td>
    </tr>
  `).join('');
}

async function loadProducts() {
  categories = (await api('/products/categories/all')).data;
  const data = await api('/products?limit=100');
  products = data.data;
  renderProducts();
}

function renderProducts() {
  const tbody = document.getElementById('products-list');
  tbody.innerHTML = products.map(p => `
    <tr>
      <td>${p.sku}</td>
      <td>${p.name.fa}</td>
      <td>${formatMoney(p.price)}</td>
      <td>${p.stock}</td>
      <td>${p.isActive ? 'فعال' : 'غیرفعال'}</td>
      <td>
        <button class="btn btn-secondary" onclick="editProduct(${p.id})">ویرایش</button>
        <button class="btn btn-danger" onclick="deleteProduct(${p.id})">حذف</button>
      </td>
    </tr>
  `).join('');
}

document.getElementById('add-product-btn').addEventListener('click', () => openProductModal());

function openProductModal(product = null) {
  const modal = document.getElementById('product-modal');
  const form = document.getElementById('product-form');
  const catSelect = form.categoryId;
  catSelect.innerHTML = '<option value="">بدون دسته</option>' + categories.map(c => `<option value="${c.id}">${c.name_fa}</option>`).join('');

  form.reset();
  form.id.value = product ? product.id : '';
  document.getElementById('product-modal-title').textContent = product ? 'ویرایش محصول' : 'محصول جدید';

  if (product) {
    form.sku.value = product.sku;
    form.slug.value = product.slug;
    form.nameFa.value = product.name.fa;
    form.nameEn.value = product.name.en || '';
    form.price.value = product.price;
    form.comparePrice.value = product.comparePrice || '';
    form.stock.value = product.stock;
    form.weightGrams.value = product.weightGrams || 0;
    form.categoryId.value = product.categoryId || '';
    form.images.value = JSON.stringify(product.images || []);
    form.colors.value = JSON.stringify(product.colors || []);
    form.sizes.value = JSON.stringify(product.sizes || []);
    form.description.value = product.description || '';
    form.isFeatured.checked = product.isFeatured;
    form.isActive.checked = product.isActive;
  }

  modal.classList.remove('hidden');
}

document.getElementById('close-product-modal').addEventListener('click', () => {
  document.getElementById('product-modal').classList.add('hidden');
});

document.getElementById('product-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const payload = {
    sku: form.sku.value,
    slug: form.slug.value,
    nameFa: form.nameFa.value,
    nameEn: form.nameEn.value,
    price: parseInt(form.price.value),
    comparePrice: form.comparePrice.value ? parseInt(form.comparePrice.value) : null,
    stock: parseInt(form.stock.value),
    weightGrams: parseInt(form.weightGrams.value),
    categoryId: form.categoryId.value ? parseInt(form.categoryId.value) : null,
    images: JSON.parse(form.images.value || '[]'),
    colors: JSON.parse(form.colors.value || '[]'),
    sizes: JSON.parse(form.sizes.value || '[]'),
    description: form.description.value,
    isFeatured: form.isFeatured.checked,
    isActive: form.isActive.checked
  };
  const id = form.id.value;
  try {
    if (id) {
      await api(`/products/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
    } else {
      await api('/products', { method: 'POST', body: JSON.stringify(payload) });
    }
    document.getElementById('product-modal').classList.add('hidden');
    await loadProducts();
  } catch (err) {
    alert(err.message);
  }
});

window.editProduct = async (id) => {
  const p = products.find(x => x.id === id);
  if (!p) return;
  // refresh categories for select
  categories = (await api('/products/categories/all')).data;
  openProductModal(p);
};

window.deleteProduct = async (id) => {
  if (!confirm('آیا مطمئنید؟')) return;
  await api(`/products/${id}`, { method: 'DELETE' });
  await loadProducts();
};

async function loadOrders() {
  const data = await api('/orders');
  orders = data.data;
  renderOrders();
}

function renderOrders() {
  const statusFilter = document.getElementById('order-status-filter').value;
  const payFilter = document.getElementById('payment-status-filter').value;
  const search = document.getElementById('order-search').value.trim();

  const filtered = orders.filter(o => {
    if (statusFilter && o.status !== statusFilter) return false;
    if (payFilter && o.paymentStatus !== payFilter) return false;
    if (search && !o.orderNumber.includes(search)) return false;
    return true;
  });

  const tbody = document.getElementById('orders-list');
  tbody.innerHTML = filtered.map(o => `
    <tr>
      <td>${o.orderNumber}</td>
      <td>${o.user ? (o.user.name || o.user.email) : 'مهمان'}</td>
      <td>${formatMoney(o.total)}</td>
      <td>${o.status}</td>
      <td><span class="badge badge-${o.paymentStatus === 'paid' ? 'paid' : 'unpaid'}">${o.paymentStatus === 'paid' ? 'پرداخت شده' : 'پرداخت نشده'}</span></td>
      <td>${o.shippingStatus}</td>
      <td>${formatDate(o.createdAt)}</td>
      <td><button class="btn btn-secondary" onclick="viewOrder(${o.id})">مشاهده</button></td>
    </tr>
  `).join('');
}

['order-status-filter', 'payment-status-filter', 'order-search'].forEach(id => {
  document.getElementById(id).addEventListener('input', renderOrders);
});

let currentOrderId = null;
window.viewOrder = async (id) => {
  const data = await api(`/orders/${id}`);
  const o = data.data;
  currentOrderId = id;
  const detail = document.getElementById('order-detail');
  detail.innerHTML = `
    <p><strong>شماره سفارش:</strong> ${o.orderNumber}</p>
    <p><strong>مشتری:</strong> ${o.user ? (o.user.name || o.user.email) : 'مهمان'}</p>
    <p><strong>آدرس:</strong> ${o.address ? `${o.address.recipientName} - ${o.address.province}، ${o.address.city}، ${o.address.address}` : '-'}</p>
    <p><strong>جمع:</strong> ${formatMoney(o.subtotal)} | <strong>ارسال:</strong> ${formatMoney(o.shippingCost)} | <strong>کل:</strong> ${formatMoney(o.total)}</p>
    <p><strong>کد رهگیری:</strong> ${o.trackingCode || '-'}</p>
    <h4>اقلام</h4>
    <ul>${o.items.map(i => `<li>${i.productName} - ${i.quantity} عدد - ${formatMoney(i.totalPrice)}</li>`).join('')}</ul>
  `;
  const form = document.getElementById('order-status-form');
  form.status.value = o.status;
  form.paymentStatus.value = o.paymentStatus;
  form.shippingStatus.value = o.shippingStatus;
  form.trackingCode.value = o.trackingCode || '';
  document.getElementById('order-modal').classList.remove('hidden');
};

document.getElementById('close-order-modal').addEventListener('click', () => {
  document.getElementById('order-modal').classList.add('hidden');
});

document.getElementById('order-status-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  await api(`/orders/${currentOrderId}/status`, {
    method: 'PUT',
    body: JSON.stringify({
      status: form.status.value,
      paymentStatus: form.paymentStatus.value,
      shippingStatus: form.shippingStatus.value,
      trackingCode: form.trackingCode.value
    })
  });
  document.getElementById('order-modal').classList.add('hidden');
  await loadOrders();
});

async function loadUsers() {
  const data = await api('/admin/users');
  users = data.data;
  const tbody = document.getElementById('users-list');
  tbody.innerHTML = users.map(u => `
    <tr>
      <td>${u.email}</td>
      <td>${u.first_name} ${u.last_name}</td>
      <td>${u.phone || '-'}</td>
      <td>${u.is_admin ? 'مدیر' : 'کاربر'}</td>
      <td>${u.is_active ? 'فعال' : 'غیرفعال'}</td>
      <td>
        <button class="btn btn-secondary" onclick="toggleUser(${u.id}, ${!u.is_active}, ${u.is_admin})">${u.is_active ? 'غیرفعال' : 'فعال'}</button>
        <button class="btn btn-secondary" onclick="toggleUser(${u.id}, ${u.is_active}, ${!u.is_admin})">${u.is_admin ? 'حذف مدیریت' : 'مدیر'}</button>
      </td>
    </tr>
  `).join('');
}

window.toggleUser = async (id, isActive, isAdmin) => {
  await api(`/admin/users/${id}`, { method: 'PUT', body: JSON.stringify({ isActive, isAdmin }) });
  await loadUsers();
};

async function loadSettings() {
  const data = await api('/admin/settings');
  const form = document.getElementById('settings-form');
  for (const [key, value] of Object.entries(data.data)) {
    const input = form.querySelector(`[name="${key}"]`);
    if (input) input.value = value;
  }
}

document.getElementById('settings-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const payload = {};
  form.querySelectorAll('input, select').forEach(el => payload[el.name] = el.value);
  await api('/admin/settings', { method: 'PUT', body: JSON.stringify(payload) });
  alert('تنظیمات ذخیره شد');
});

if (token) initApp();
