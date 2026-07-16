(function() {
  const API_BASE = (typeof CONFIG !== 'undefined' && CONFIG.API_BASE) ? CONFIG.API_BASE : '/api';
  const STATIC_MODE = (typeof CONFIG !== 'undefined' && CONFIG.STATIC_MODE) ? true : false;
  let user = null;

  function getToken() { return localStorage.getItem('noqteh_token'); }
  function setToken(t) { localStorage.setItem('noqteh_token', t); }
  function removeToken() { localStorage.removeItem('noqteh_token'); }

  async function api(path, options = {}) {
    if (STATIC_MODE) throw new Error('در حالت آفلاین، ارتباط با سرور امکان‌پذیر نیست');
    const res = await fetch(`${API_BASE}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {})
      },
      ...options
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'خطا در ارتباط با سرور');
    return data;
  }

  async function fetchUser() {
    if (STATIC_MODE) return null;
    const t = getToken();
    if (!t) return null;
    try {
      const data = await api('/auth/me');
      user = data.user;
      return user;
    } catch {
      removeToken();
      return null;
    }
  }

  function updateAuthUI() {
    const user = getUser();
    document.querySelectorAll('.auth-link').forEach(link => {
      if (STATIC_MODE) {
        link.textContent = 'حساب کاربری';
        link.href = 'account.html';
        link.onclick = null;
        return;
      }
      link.textContent = user ? (user.firstName || user.email) : 'ورود / ثبت‌نام';
      link.href = user ? 'account.html' : '#';
      link.onclick = user ? null : (e) => { e.preventDefault(); if (window.openAuthModal) window.openAuthModal(); };
    });
    document.querySelectorAll('.account-only').forEach(el => el.classList.toggle('hidden', !user && !STATIC_MODE));
  }

  async function login(email, password) {
    if (STATIC_MODE) throw new Error('در حالت آفلاین امکان ورود نیست');
    const data = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    setToken(data.token);
    user = data.user;
    updateAuthUI();
    return user;
  }

  async function register(payload) {
    if (STATIC_MODE) throw new Error('در حالت آفلاین امکان ثبت‌نام نیست');
    const data = await api('/auth/register', { method: 'POST', body: JSON.stringify(payload) });
    setToken(data.token);
    user = data.user;
    updateAuthUI();
    return user;
  }

  function logout() {
    removeToken();
    user = null;
    updateAuthUI();
    if (!STATIC_MODE) location.href = 'index.html';
  }

  function requireAuth() {
    if (STATIC_MODE) return false;
    if (!getToken()) {
      location.href = 'index.html?login=1';
      return false;
    }
    return true;
  }

  window.NOQTEH_AUTH = { getToken, api, fetchUser, login, register, logout, requireAuth, getUser: () => user };

  document.addEventListener('DOMContentLoaded', async () => {
    await fetchUser();
    updateAuthUI();
  });
})();
