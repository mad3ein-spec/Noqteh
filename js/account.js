(function() {
  const { api, fetchUser, getUser } = window.NOQTEH_AUTH;

  function formatMoney(n) {
    return Number(n || 0).toLocaleString('fa-IR');
  }

  function showLoginRequired() {
    document.getElementById('auth-panel').classList.remove('hidden');
    document.getElementById('account-panel').classList.add('hidden');
  }

  function showAccount() {
    document.getElementById('auth-panel').classList.add('hidden');
    document.getElementById('account-panel').classList.remove('hidden');
  }

  async function init() {
    const STATIC_MODE = (typeof CONFIG !== 'undefined' && CONFIG.STATIC_MODE) ? true : false;
    if (STATIC_MODE) {
      document.getElementById('auth-panel').innerHTML = '<p>در نسخه آزمایشی آنلاین، حساب کاربری و تاریخچه سفارشات روی سرور ذخیره می‌شود. این بخش فعلاً غیرفعال است.</p><a href="index.html" class="btn">بازگشت به صفحه اصلی</a>';
      document.getElementById('auth-panel').classList.remove('hidden');
      document.getElementById('account-panel').classList.add('hidden');
      return;
    }
    const user = await fetchUser();
    if (!user) return showLoginRequired();
    showAccount();
    loadOrders();
    loadAddresses();
    fillProfile(user);
  }

  async function loadOrders() {
    try {
      const data = await api('/orders/my');
      const container = document.getElementById('orders-list');
      if (!data.data.length) {
        container.innerHTML = '<p>سفارشی ثبت نشده است.</p>';
        return;
      }
      container.innerHTML = data.data.map(o => `
        <div class="order-card">
          <div style="display:flex; justify-content:space-between; flex-wrap:wrap; gap:12px;">
            <strong>${o.orderNumber}</strong>
            <span>${formatMoney(o.total)} تومان</span>
          </div>
          <p style="margin:8px 0 0; color:var(--color-text-light);">
            وضعیت: ${o.status} | پرداخت: ${o.paymentStatus === 'paid' ? 'پرداخت شده' : 'پرداخت نشده'}
          </p>
          <p style="margin:4px 0 0; color:var(--color-text-light); font-size:13px;">
            ${new Date(o.createdAt).toLocaleString('fa-IR')}
          </p>
        </div>
      `).join('');
    } catch (err) {
      document.getElementById('orders-list').innerHTML = `<p class="error">${err.message}</p>`;
    }
  }

  async function loadAddresses() {
    try {
      const data = await api('/addresses');
      const container = document.getElementById('addresses-list');
      if (!data.data.length) {
        container.innerHTML = '<p>آدرسی ثبت نشده است.</p>';
        return;
      }
      container.innerHTML = data.data.map(a => `
        <div class="address-card">
          ${a.isDefault ? '<span class="default-badge">پیش‌فرض</span>' : ''}
          <strong>${a.title || 'آدرس'}</strong>
          <p>${a.recipientName} - ${a.phone}</p>
          <p>${a.province}، ${a.city}، ${a.district || ''}، ${a.address}</p>
          <p style="font-size:13px; color:var(--color-text-light);">کد پستی: ${a.postalCode || '-'}</p>
        </div>
      `).join('');
    } catch (err) {
      document.getElementById('addresses-list').innerHTML = `<p class="error">${err.message}</p>`;
    }
  }

  function fillProfile(user) {
    const form = document.getElementById('profile-form');
    if (!form) return;
    form.firstName.value = user.firstName || '';
    form.lastName.value = user.lastName || '';
    form.phone.value = user.phone || '';
  }

  document.addEventListener('DOMContentLoaded', () => {
    init();

    document.querySelectorAll('.account-tabs button').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.account-tabs button').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(`${btn.dataset.tab}-panel`).classList.add('active');
      });
    });

    document.getElementById('add-address-btn')?.addEventListener('click', () => {
      document.getElementById('address-form').classList.remove('hidden');
    });

    document.getElementById('cancel-address')?.addEventListener('click', () => {
      document.getElementById('address-form').classList.add('hidden');
      document.getElementById('address-form').reset();
    });

    document.getElementById('address-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = e.target;
      await api('/addresses', {
        method: 'POST',
        body: JSON.stringify({
          title: f.title.value,
          recipientName: f.recipientName.value,
          phone: f.phone.value,
          province: f.province.value,
          city: f.city.value,
          district: f.district.value,
          postalCode: f.postalCode.value,
          address: f.address.value,
          isDefault: f.isDefault.checked
        })
      });
      f.reset();
      f.classList.add('hidden');
      loadAddresses();
    });

    document.getElementById('profile-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = e.target;
      await api('/auth/me', {
        method: 'PUT',
        body: JSON.stringify({ firstName: f.firstName.value, lastName: f.lastName.value, phone: f.phone.value })
      });
      alert('پروفایل بروزرسانی شد');
    });

    document.getElementById('password-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = e.target;
      await api('/auth/password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword: f.currentPassword.value, newPassword: f.newPassword.value })
      });
      alert('رمز عبور تغییر کرد');
      f.reset();
    });
  });
})();
