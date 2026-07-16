// ========================================
// NOQTEH — Complete Shop Logic & UI
// ========================================

// ========================================
// Cart Management
// ========================================
let cart = JSON.parse(localStorage.getItem('noqtehCart')) || [];
let wishlist = JSON.parse(localStorage.getItem('noqtehWishlist')) || [];

function saveCart() {
  localStorage.setItem('noqtehCart', JSON.stringify(cart));
}

function saveWishlist() {
  localStorage.setItem('noqtehWishlist', JSON.stringify(wishlist));
}

function updateCartCount() {
  const countElements = document.querySelectorAll('.cart-count');
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  countElements.forEach(el => {
    el.textContent = totalItems;
    el.style.display = totalItems > 0 ? 'flex' : 'none';
  });
}

function addToCart(productId, color, size, quantity = 1) {
  const product = getProductById(productId);
  if (!product) return;

  const existingIndex = cart.findIndex(
    item => item.id === productId && item.color === color && item.size === size
  );

  if (existingIndex >= 0) {
    cart[existingIndex].quantity += quantity;
  } else {
    cart.push({
      id: productId,
      title: product.title,
      price: product.price,
      image: product.image || 'hero-1.jpg',
      color: color,
      size: size,
      quantity: quantity
    });
  }

  saveCart();
  updateCartCount();
  renderCartDrawer();
  showNotification('به سبد خرید اضافه شد', 'success');
}

function removeFromCart(index) {
  cart.splice(index, 1);
  saveCart();
  updateCartCount();
  renderCartDrawer();
  if (document.getElementById('cart-items')) renderCart();
}

function updateQuantity(index, change) {
  cart[index].quantity += change;
  if (cart[index].quantity <= 0) {
    cart.splice(index, 1);
  }
  saveCart();
  updateCartCount();
  renderCartDrawer();
  if (document.getElementById('cart-items')) renderCart();
}

function getCartTotal() {
  return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

// ========================================
// Wishlist Management
// ========================================
function toggleWishlist(productId) {
  const index = wishlist.indexOf(productId);
  if (index >= 0) {
    wishlist.splice(index, 1);
    saveWishlist();
    showNotification('از علاقه‌مندی‌ها حذف شد', 'info');
    return false;
  } else {
    wishlist.push(productId);
    saveWishlist();
    showNotification('به علاقه‌مندی‌ها اضافه شد', 'success');
    return true;
  }
}

function isInWishlist(productId) {
  return wishlist.includes(productId);
}

// ========================================
// Notifications
// ========================================
function showNotification(message, type = 'success') {
  let notification = document.querySelector('.notification');
  if (!notification) {
    notification = document.createElement('div');
    notification.className = 'notification';
    document.body.appendChild(notification);
  }

  const icons = {
    success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
    error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>'
  };

  notification.innerHTML = icons[type] + '<span>' + message + '</span>';
  notification.classList.add('show');

  setTimeout(() => {
    notification.classList.remove('show');
  }, 3000);
}

// ========================================
// Cart Drawer
// ========================================
function initCartDrawer() {
  let drawer = document.getElementById('cart-drawer');
  let overlay = document.getElementById('cart-drawer-overlay');

  if (!drawer) {
    drawer = document.createElement('div');
    drawer.id = 'cart-drawer';
    drawer.className = 'cart-drawer';
    document.body.appendChild(drawer);
  }

  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'cart-drawer-overlay';
    overlay.className = 'cart-drawer-overlay';
    overlay.addEventListener('click', closeCartDrawer);
    document.body.appendChild(overlay);
  }

  renderCartDrawer();

  document.querySelectorAll('.cart-btn, .side-nav-cart').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openCartDrawer();
    });
  });
}

function openCartDrawer() {
  const drawer = document.getElementById('cart-drawer');
  const overlay = document.getElementById('cart-drawer-overlay');
  if (drawer && overlay) {
    drawer.classList.add('open');
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
}

function closeCartDrawer() {
  const drawer = document.getElementById('cart-drawer');
  const overlay = document.getElementById('cart-drawer-overlay');
  if (drawer && overlay) {
    drawer.classList.remove('open');
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }
}

function renderCartDrawer() {
  const drawer = document.getElementById('cart-drawer');
  if (!drawer) return;

  const subtotal = getCartTotal();
  const shipping = subtotal >= 1000000 ? 0 : 50000;
  const total = subtotal + shipping;

  if (cart.length === 0) {
    drawer.innerHTML = `
      <div class="cart-drawer-header">
        <h3>سبد خرید</h3>
        <button class="cart-drawer-close" onclick="closeCartDrawer()">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="cart-drawer-empty">
        <p>سبد خرید شما خالی است</p>
        <a href="shop.html" class="btn btn-dark" onclick="closeCartDrawer()">مشاهده محصولات</a>
      </div>
    `;
    return;
  }

  drawer.innerHTML = `
    <div class="cart-drawer-header">
      <h3>سبد خرید <span>(${cart.reduce((s, i) => s + i.quantity, 0)} مورد)</span></h3>
      <button class="cart-drawer-close" onclick="closeCartDrawer()">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div class="cart-drawer-items">
      ${cart.map((item, index) => `
        <div class="cart-drawer-item">
          <img src="assets/${item.image}" alt="${item.title}">
          <div class="cart-drawer-item-info">
            <h4>${item.title}</h4>
            <p class="variant">
              <span style="display:inline-block;width:10px;height:10px;background:${item.color};border-radius:50%;vertical-align:middle;margin-left:6px;border:1px solid rgba(0,0,0,0.1)"></span>
              سایز: ${item.size}
            </p>
            <div class="quantity-controls">
              <button onclick="updateQuantity(${index}, -1)">−</button>
              <input type="text" value="${item.quantity}" readonly>
              <button onclick="updateQuantity(${index}, 1)">+</button>
            </div>
          </div>
          <div class="cart-drawer-item-price">
            <span>${formatPrice(item.price * item.quantity)}</span>
            <button class="remove-btn" onclick="removeFromCart(${index})">حذف</button>
          </div>
        </div>
      `).join('')}
    </div>
    <div class="cart-drawer-footer">
      <div class="summary-row">
        <span>جمع کل</span>
        <span>${formatPrice(subtotal)}</span>
      </div>
      <div class="summary-row">
        <span>هزینه ارسال</span>
        <span>${shipping === 0 ? 'رایگان' : formatPrice(shipping)}</span>
      </div>
      <div class="summary-row total">
        <span>مبلغ قابل پرداخت</span>
        <span>${formatPrice(total)}</span>
      </div>
      <a href="checkout.html" class="btn btn-dark" style="width: 100%; margin-top: 16px;" onclick="closeCartDrawer()">ادامه به پرداخت</a>
    </div>
  `;
}

// ========================================
// Quick View Modal
// ========================================
function initQuickView() {
  document.addEventListener('click', (e) => {
    const item = e.target.closest('.shop-item');
    if (!item) return;
    if (e.target.closest('.quick-add, .wishlist-btn')) return;

    const productId = Number(item.dataset.id);
    openQuickView(productId);
  });
}

function openQuickView(productId) {
  const product = getProductById(productId);
  if (!product) return;

  let modal = document.getElementById('quick-view-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'quick-view-modal';
    modal.className = 'quick-view-modal';
    document.body.appendChild(modal);
  }

  let overlay = document.getElementById('quick-view-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'quick-view-overlay';
    overlay.className = 'quick-view-overlay';
    overlay.addEventListener('click', closeQuickView);
    document.body.appendChild(overlay);
  }

  let selectedColor = product.colors[0];
  let selectedSize = product.sizes[1];

  modal.innerHTML = `
    <button class="quick-view-close" onclick="closeQuickView()">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
    <div class="quick-view-content">
      <div class="quick-view-image">
        <img src="assets/${product.image || 'hero-1.jpg'}" alt="${product.title}" id="quick-view-img">
      </div>
      <div class="quick-view-info">
        <p class="category">${product.category}</p>
        <h2>${product.title}</h2>
        <p class="price">${formatPrice(product.price)}</p>
        <p class="description">${product.description}</p>
        
        <div class="product-options">
          <h4>رنگ</h4>
          <div class="color-options">
            ${product.colors.map((color, idx) => `
              <div class="color-option ${idx === 0 ? 'active' : ''}" style="background-color: ${color}" data-color="${color}" onclick="selectQuickViewColor(this, '${color}')"></div>
            `).join('')}
          </div>
        </div>
        
        <div class="product-options">
          <h4>سایز</h4>
          <div class="size-options">
            ${product.sizes.map((size, idx) => `
              <div class="size-option ${idx === 1 ? 'active' : ''}" data-size="${size}" onclick="selectQuickViewSize(this, '${size}')">${size}</div>
            `).join('')}
          </div>
        </div>
        
        <button class="btn btn-dark" style="width: 100%; margin-top: 24px;" onclick="addToCart(${product.id}, '${selectedColor}', '${selectedSize}', 1); closeQuickView();">افزودن به سبد خرید</button>
        <a href="product.html?id=${product.id}" class="btn btn-light" style="width: 100%; margin-top: 10px;">مشاهده جزئیات</a>
      </div>
    </div>
  `;

  modal.dataset.color = selectedColor;
  modal.dataset.size = selectedSize;

  modal.classList.add('open');
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeQuickView() {
  const modal = document.getElementById('quick-view-modal');
  const overlay = document.getElementById('quick-view-overlay');
  if (modal && overlay) {
    modal.classList.remove('open');
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }
}

function selectQuickViewColor(el, color) {
  el.parentElement.querySelectorAll('.color-option').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  const modal = document.getElementById('quick-view-modal');
  if (modal) modal.dataset.color = color;
  updateQuickViewAddButton();
}

function selectQuickViewSize(el, size) {
  el.parentElement.querySelectorAll('.size-option').forEach(s => s.classList.remove('active'));
  el.classList.add('active');
  const modal = document.getElementById('quick-view-modal');
  if (modal) modal.dataset.size = size;
  updateQuickViewAddButton();
}

function updateQuickViewAddButton() {
  const modal = document.getElementById('quick-view-modal');
  if (!modal) return;
  const btn = modal.querySelector('.quick-view-info .btn-dark');
  if (btn) {
    const productId = Number(btn.getAttribute('onclick').match(/addToCart\((\d+)/)[1]);
    btn.setAttribute('onclick', `addToCart(${productId}, '${modal.dataset.color}', '${modal.dataset.size}', 1); closeQuickView();`);
  }
}

// ========================================
// Size Guide Modal
// ========================================
function initSizeGuide() {
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('size-guide-link')) {
      e.preventDefault();
      openSizeGuide();
    }
  });
}

function openSizeGuide() {
  let modal = document.getElementById('size-guide-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'size-guide-modal';
    modal.className = 'size-guide-modal';
    document.body.appendChild(modal);
  }

  let overlay = document.getElementById('size-guide-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'size-guide-overlay';
    overlay.className = 'size-guide-overlay';
    overlay.addEventListener('click', closeSizeGuide);
    document.body.appendChild(overlay);
  }

  modal.innerHTML = `
    <button class="size-guide-close" onclick="closeSizeGuide()">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
    <h2>راهنمای سایز</h2>
    <p>جوراب‌های NOQTEH بر اساس سایز کفش طراحی شده‌اند.</p>
    <table class="size-guide-table">
      <thead>
        <tr>
          <th>سایز جوراب</th>
          <th>سایز کفش</th>
          <th>سانتی‌متر</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>۳۶-۳۸</td><td>۳۶ تا ۳۸</td><td>۲۳ تا ۲۴</td></tr>
        <tr><td>۳۹-۴۱</td><td>۳۹ تا ۴۱</td><td>۲۴.۵ تا ۲۶</td></tr>
        <tr><td>۴۲-۴۴</td><td>۴۲ تا ۴۴</td><td>۲۶.۵ تا ۲۸</td></tr>
      </tbody>
    </table>
    <p style="margin-top: 24px; font-size: 13px; color: var(--color-text-light);">
      نکته: به دلیل کشسانی نخ پنبه‌ای، جوراب‌ها تا حدی انعطاف‌پذیر هستند و معمولاً یک سایز کوچک‌تر یا بزرگ‌تر هم مناسب است.
    </p>
  `;

  modal.classList.add('open');
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeSizeGuide() {
  const modal = document.getElementById('size-guide-modal');
  const overlay = document.getElementById('size-guide-overlay');
  if (modal && overlay) {
    modal.classList.remove('open');
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }
}

// ========================================
// Image Zoom
// ========================================
function initImageZoom() {
  const zoomContainers = document.querySelectorAll('.zoom-container');
  zoomContainers.forEach(container => {
    const img = container.querySelector('img');
    if (!img) return;

    container.addEventListener('mousemove', (e) => {
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      img.style.transformOrigin = `${x * 100}% ${y * 100}%`;
      img.style.transform = 'scale(1.6)';
    });

    container.addEventListener('mouseleave', () => {
      img.style.transform = 'scale(1)';
      setTimeout(() => {
        img.style.transformOrigin = 'center center';
      }, 200);
    });
  });
}

// ========================================
// Scroll Reveal Animation
// ========================================
function initScrollReveal() {
  const textElements = document.querySelectorAll('.reveal-text, .reveal, .reveal-left, .reveal-right, .reveal-scale');
  const imageElements = document.querySelectorAll('.ken-burns');
  const allElements = [...textElements, ...imageElements];
  if (allElements.length === 0) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -80px 0px'
  });

  allElements.forEach(el => observer.observe(el));
}

// ========================================
// Parallax Effect
// ========================================
function initParallax() {
  const parallaxElements = document.querySelectorAll('.parallax');
  if (parallaxElements.length === 0) return;

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const scrolled = window.pageYOffset;
      parallaxElements.forEach(el => {
        const speed = el.dataset.speed || 0.08;
        el.style.transform = `translateY(${scrolled * speed}px) scale(1.08)`;
      });
      ticking = false;
    });
  }, { passive: true });
}

// ========================================
// Back to Top
// ========================================
function initBackToTop() {
  let backToTop = document.querySelector('.back-to-top');
  if (!backToTop) {
    backToTop = document.createElement('button');
    backToTop.className = 'back-to-top';
    backToTop.setAttribute('aria-label', 'بازگشت به بالا');
    backToTop.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 15l-6-6-6 6"/></svg>';
    document.body.appendChild(backToTop);
  }

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      if (window.scrollY > 500) {
        backToTop.classList.add('visible');
      } else {
        backToTop.classList.remove('visible');
      }
      ticking = false;
    });
  }, { passive: true });

  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// ========================================
// Header Scroll Effect
// ========================================
function initHeaderScroll() {
  const topBar = document.getElementById('top-bar');
  if (!topBar) return;

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      if (window.scrollY > 50) {
        topBar.classList.add('scrolled');
      } else {
        topBar.classList.remove('scrolled');
      }
      ticking = false;
    });
  }, { passive: true });
}

// ========================================
// Marquee
// ========================================
function initMarquee() {
  const marquees = document.querySelectorAll('.marquee');
  marquees.forEach(marquee => {
    const content = marquee.querySelector('.marquee-content');
    if (!content) return;
    const clone = content.cloneNode(true);
    marquee.appendChild(clone);
  });
}

// ========================================
// Custom Cursor
// ========================================
function initCustomCursor() {
  if (window.matchMedia('(pointer: coarse)').matches) return;

  const cursor = document.createElement('div');
  cursor.className = 'cursor';
  document.body.appendChild(cursor);

  const cursorDot = document.createElement('div');
  cursorDot.className = 'cursor-dot';
  document.body.appendChild(cursorDot);

  let mouseX = 0, mouseY = 0;
  let cursorX = 0, cursorY = 0;
  let dotX = 0, dotY = 0;
  let isMoving = false;
  let moveTimeout;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    isMoving = true;
    clearTimeout(moveTimeout);
    moveTimeout = setTimeout(() => { isMoving = false; }, 100);
  });

  let rafId;
  function animate() {
    cursorX += (mouseX - cursorX) * 0.15;
    cursorY += (mouseY - cursorY) * 0.15;
    dotX += (mouseX - dotX) * 0.35;
    dotY += (mouseY - dotY) * 0.35;

    cursor.style.left = cursorX + 'px';
    cursor.style.top = cursorY + 'px';
    cursorDot.style.left = dotX + 'px';
    cursorDot.style.top = dotY + 'px';

    if (isMoving || Math.abs(mouseX - cursorX) > 0.5 || Math.abs(mouseY - cursorY) > 0.5) {
      rafId = requestAnimationFrame(animate);
    } else {
      rafId = null;
    }
  }

  document.addEventListener('mousemove', () => {
    if (!rafId) rafId = requestAnimationFrame(animate);
  });

  animate();

  const hoverElements = document.querySelectorAll('a, button, .shop-item, .lookbook-item, .masonry-item');
  hoverElements.forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
  });
}

// ========================================
// Dark Mode
// ========================================
function initDarkMode() {
  const themeToggle = document.getElementById('theme-toggle');
  if (!themeToggle) return;

  const savedTheme = localStorage.getItem('noqtehTheme');
  if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
  }

  themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('noqtehTheme', newTheme);
    updateThemeIcon(newTheme);
  });
}

function updateThemeIcon(theme) {
  const themeToggle = document.getElementById('theme-toggle');
  if (!themeToggle) return;

  const sunIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';
  const moonIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';

  themeToggle.innerHTML = theme === 'dark' ? sunIcon : moonIcon;
}

// ========================================
// Full-Screen Menu with Image Preview
// ========================================
function initFullscreenMenu() {
  const menuToggle = document.getElementById('menu-toggle');
  const sideNav = document.getElementById('side-nav');
  const overlay = document.getElementById('side-nav-overlay');
  if (!menuToggle || !sideNav) return;

  // Create preview element
  let preview = sideNav.querySelector('.side-nav-preview');
  if (!preview) {
    preview = document.createElement('div');
    preview.className = 'side-nav-preview';
    preview.innerHTML = '<img src="assets/hero-1.jpg" alt="menu preview">';
    sideNav.appendChild(preview);
  }

  const previewImg = preview.querySelector('img');
  const previewImages = {
    'index.html': 'assets/hero-1.jpg',
    'shop.html': 'assets/editorial-11.jpg',
    'lookbook.html': 'assets/editorial-8.jpg',
    'about.html': 'assets/editorial-5.jpg',
    'contact.html': 'assets/editorial-13.jpg'
  };

  menuToggle.addEventListener('click', toggleMenu);
  if (overlay) overlay.addEventListener('click', toggleMenu);

  document.querySelectorAll('.side-nav-links a').forEach(link => {
    link.addEventListener('click', () => {
      if (!link.closest('.side-nav')) return;
      toggleMenu();
    });

    link.addEventListener('mouseenter', () => {
      const href = link.getAttribute('href');
      const imgSrc = previewImages[href] || 'assets/hero-1.jpg';
      previewImg.src = imgSrc;
      preview.style.opacity = '1';
    });

    link.addEventListener('mouseleave', () => {
      preview.style.opacity = '0';
    });
  });
}

function toggleMenu() {
  const menuToggle = document.getElementById('menu-toggle');
  const sideNav = document.getElementById('side-nav');
  const overlay = document.getElementById('side-nav-overlay');
  if (!menuToggle || !sideNav) return;

  menuToggle.classList.toggle('active');
  sideNav.classList.toggle('open');
  if (overlay) overlay.classList.toggle('open');
  document.body.style.overflow = sideNav.classList.contains('open') ? 'hidden' : '';
}

// ========================================
// Shop Filters & Search
// ========================================
function initShopFilters() {
  const filterContainer = document.getElementById('shop-filters');
  const searchInput = document.getElementById('shop-search');
  const grid = document.getElementById('shop-grid');
  if (!grid) return;

  function setup() {
    renderShopProducts(products);

    if (filterContainer) {
      const categories = ['همه', ...new Set(products.map(p => p.category))];
      filterContainer.innerHTML = categories.map(cat => `
        <button class="filter-btn ${cat === 'همه' ? 'active' : ''}" data-filter="${cat}">${cat}</button>
      `).join('');

      filterContainer.addEventListener('click', (e) => {
        if (!e.target.classList.contains('filter-btn')) return;
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        const filter = e.target.dataset.filter;
        const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
        filterProducts(filter, searchTerm);
      });
    }

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const activeFilter = document.querySelector('.filter-btn.active');
        const filter = activeFilter ? activeFilter.dataset.filter : 'همه';
        filterProducts(filter, e.target.value.toLowerCase());
      });
    }
  }

  if (productsLoaded) setup();
  else document.addEventListener('noqteh:productsLoaded', setup, { once: true });
}

function filterProducts(category, searchTerm) {
  let filtered = products;
  if (category !== 'همه') filtered = filtered.filter(p => p.category === category);
  if (searchTerm) filtered = filtered.filter(p => p.title.toLowerCase().includes(searchTerm) || p.category.toLowerCase().includes(searchTerm));
  renderShopProducts(filtered);
}

function renderShopProducts(productList) {
  const grid = document.getElementById('shop-grid');
  if (!grid) return;

  if (productList.length === 0) {
    grid.innerHTML = '<div class="no-results">محصولی با این مشخصات یافت نشد.</div>';
    return;
  }

  grid.innerHTML = productList.map((product) => {
    const isWishlisted = isInWishlist(product.id);
    return `
      <div class="shop-item reveal" data-id="${product.id}">
        <img src="assets/${product.image || 'hero-1.jpg'}" alt="${product.title}" loading="lazy">
        <button class="wishlist-btn ${isWishlisted ? 'active' : ''}" onclick="event.stopPropagation(); handleWishlistClick(this, ${product.id})">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        </button>
        <button class="quick-add" onclick="event.stopPropagation(); addToCart(${product.id}, '${product.colors[0]}', '${product.sizes[1]}', 1)">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </button>
        <div class="shop-item-info">
          <h3 class="shop-item-title">${product.title}</h3>
          <p class="shop-item-price">${formatPrice(product.price)}</p>
        </div>
      </div>
    `;
  }).join('');

  initScrollReveal();
}

function handleWishlistClick(btn, productId) {
  const added = toggleWishlist(productId);
  btn.classList.toggle('active', added);
}

// ========================================
// Product Detail
// ========================================
async function renderProductDetail() {
  const container = document.getElementById('product-detail');
  if (!container) return;

  if (!productsLoaded) {
    await new Promise(resolve => {
      document.addEventListener('noqteh:productsLoaded', resolve, { once: true });
      // timeout fallback after 3s
      setTimeout(resolve, 3000);
    });
  }

  const urlParams = new URLSearchParams(window.location.search);
  const productId = Number(urlParams.get('id'));
  const product = getProductById(productId);

  if (!product) {
    container.innerHTML = `
      <div style="padding: 200px 48px; text-align: center;">
        <h2 class="display-md">محصول مورد نظر یافت نشد.</h2>
        <a href="shop.html" class="btn btn-dark" style="margin-top: 24px;">بازگشت به فروشگاه</a>
      </div>
    `;
    return;
  }

  document.title = `${product.title} — NOQTEH`;

  let selectedColor = product.colors[0];
  let selectedSize = product.sizes[1];
  let quantity = 1;
  const isWishlisted = isInWishlist(product.id);
  const secondaryImages = ['editorial-4.jpg', 'editorial-1.jpg', 'editorial-5.jpg', 'editorial-9.jpg', 'editorial-11.jpg', 'editorial-14.jpg'];
  const img2 = secondaryImages[(product.id * 2) % secondaryImages.length];
  const img3 = secondaryImages[(product.id * 3) % secondaryImages.length];

  container.innerHTML = `
    <div class="product-detail-grid">
      <div class="product-detail-images">
        <div class="zoom-container"><img src="assets/${product.image || 'hero-1.jpg'}" alt="${product.title}" class="ken-burns"></div>
        <div class="zoom-container"><img src="assets/${img2}" alt="جزئیات گلدوزی" loading="lazy"></div>
        <div class="zoom-container"><img src="assets/${img3}" alt="نمای کناری" loading="lazy"></div>
      </div>
      <div class="product-detail-info reveal-text">
        <p class="category">${product.category}</p>
        <h1>${product.title}</h1>
        <p class="price">${formatPrice(product.price)}</p>
        <p class="description">${product.description}</p>

        <div class="product-options">
          <h4>رنگ</h4>
          <div class="color-options" id="color-options">
            ${product.colors.map((color, idx) => `
              <div class="color-option ${idx === 0 ? 'active' : ''}" style="background-color: ${color}" data-color="${color}" title="${color}"></div>
            `).join('')}
          </div>
        </div>

        <div class="product-options">
          <h4>سایز <button type="button" class="size-guide-link">راهنمای سایز</button></h4>
          <div class="size-options" id="size-options">
            ${product.sizes.map((size, idx) => `
              <div class="size-option ${idx === 1 ? 'active' : ''}" data-size="${size}">${size}</div>
            `).join('')}
          </div>
        </div>

        <div class="quantity-selector">
          <h4>تعداد</h4>
          <div class="quantity-controls">
            <button type="button" id="qty-minus">−</button>
            <input type="text" id="qty-input" value="1" readonly>
            <button type="button" id="qty-plus">+</button>
          </div>
        </div>

        <button class="btn btn-dark add-to-cart-btn" id="add-to-cart-btn">افزودن به سبد خرید</button>
        <button class="btn btn-light" id="wishlist-btn" style="width: 100%;">${isWishlisted ? 'حذف از علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها'}</button>
        <a href="shop.html" class="btn btn-light" style="width: 100%; margin-top: 10px;">بازگشت به فروشگاه</a>
      </div>
    </div>
  `;

  initImageZoom();
  initSizeGuide();

  document.querySelectorAll('#color-options .color-option').forEach(el => {
    el.addEventListener('click', () => {
      document.querySelectorAll('#color-options .color-option').forEach(c => c.classList.remove('active'));
      el.classList.add('active');
      selectedColor = el.dataset.color;
    });
  });

  document.querySelectorAll('#size-options .size-option').forEach(el => {
    el.addEventListener('click', () => {
      document.querySelectorAll('#size-options .size-option').forEach(s => s.classList.remove('active'));
      el.classList.add('active');
      selectedSize = el.dataset.size;
    });
  });

  document.getElementById('qty-minus').addEventListener('click', () => {
    if (quantity > 1) { quantity--; document.getElementById('qty-input').value = quantity; }
  });

  document.getElementById('qty-plus').addEventListener('click', () => {
    quantity++; document.getElementById('qty-input').value = quantity;
  });

  document.getElementById('add-to-cart-btn').addEventListener('click', () => {
    addToCart(product.id, selectedColor, selectedSize, quantity);
  });

  document.getElementById('wishlist-btn').addEventListener('click', function() {
    const added = toggleWishlist(product.id);
    this.textContent = added ? 'حذف از علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها';
  });

  const stickyAtcPrice = document.getElementById('sticky-atc-price');
  const stickyAtcBtn = document.getElementById('sticky-atc-btn');
  if (stickyAtcPrice && stickyAtcBtn) {
    stickyAtcPrice.textContent = formatPrice(product.price);
    stickyAtcBtn.addEventListener('click', () => {
      addToCart(product.id, selectedColor, selectedSize, 1);
    });
  }
}

// ========================================
// Sticky Add to Cart (Mobile)
// ========================================
function initStickyATC() {
  const atcBar = document.getElementById('sticky-atc');
  if (!atcBar) return;

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      if (window.scrollY > 400) {
        atcBar.classList.add('visible');
      } else {
        atcBar.classList.remove('visible');
      }
      ticking = false;
    });
  }, { passive: true });
}

// ========================================
// Cart Page
// ========================================
function renderCart() {
  const container = document.getElementById('cart-container');
  const itemsContainer = document.getElementById('cart-items');
  if (!container || !itemsContainer) return;

  if (cart.length === 0) {
    container.innerHTML = `
      <div class="cart-empty">
        <h2>سبد خرید شما خالی است</h2>
        <p>محصولات کالکشن جدید را ببینید.</p>
        <a href="shop.html" class="btn btn-dark">مشاهده کالکشن</a>
      </div>
    `;
    return;
  }

  itemsContainer.innerHTML = cart.map((item, index) => `
    <div class="cart-item">
      <img src="assets/${item.image}" alt="${item.title}" loading="lazy">
      <div class="cart-item-info">
        <h3>${item.title}</h3>
        <p class="variant">
          <span style="display:inline-block;width:12px;height:12px;background:${item.color};border-radius:50%;vertical-align:middle;margin-right:6px;border:1px solid rgba(0,0,0,0.1)"></span>
          سایز: ${item.size}
        </p>
        <div class="quantity-controls">
          <button onclick="updateQuantity(${index}, -1)">−</button>
          <input type="text" value="${item.quantity}" readonly>
          <button onclick="updateQuantity(${index}, 1)">+</button>
        </div>
      </div>
      <div class="cart-item-price">${formatPrice(item.price * item.quantity)}</div>
      <button onclick="removeFromCart(${index})" style="color: var(--color-text-light); font-size: 12px; align-self: start;">حذف</button>
    </div>
  `).join('');

  const subtotal = getCartTotal();
  const shipping = subtotal >= 1000000 ? 0 : 50000;
  const total = subtotal + shipping;

  document.getElementById('cart-subtotal').textContent = formatPrice(subtotal);
  document.getElementById('cart-shipping').textContent = shipping === 0 ? 'رایگان' : formatPrice(shipping);
  document.getElementById('cart-total').textContent = formatPrice(total);
}

// ========================================
// Checkout
// ========================================
function initCheckout() {
  const form = document.getElementById('checkout-form');
  if (!form) return;

  const subtotal = getCartTotal();
  const shipping = subtotal >= 1000000 ? 0 : 50000;
  const total = subtotal + shipping;

  document.getElementById('checkout-subtotal').textContent = formatPrice(subtotal);
  document.getElementById('checkout-shipping').textContent = shipping === 0 ? 'رایگان' : formatPrice(shipping);
  document.getElementById('checkout-total').textContent = formatPrice(total);

  document.querySelectorAll('.payment-method').forEach(method => {
    method.addEventListener('click', () => {
      document.querySelectorAll('.payment-method').forEach(m => m.classList.remove('active'));
      method.classList.add('active');
      method.querySelector('input').checked = true;
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      showNotification('سبد خرید شما خالی است', 'error');
      return;
    }
    if (!form.checkValidity()) {
      showNotification('لطفاً همه فیلدها را صحیح پر کنید', 'error');
      return;
    }

    const STATIC_MODE = (typeof CONFIG !== 'undefined' && CONFIG.STATIC_MODE) ? true : false;
    if (STATIC_MODE) {
      showNotification('سفارش شما در نسخه آزمایشی ثبت شد. بخش پرداخت آنلاین به زودی فعال می‌شود.', 'success');
      cart = [];
      saveCart();
      updateCartCount();
      setTimeout(() => window.location.href = 'index.html', 2000);
      return;
    }

    if (!window.NOQTEH_AUTH || !window.NOQTEH_AUTH.getToken()) {
      showNotification('ابتدا وارد حساب کاربری شوید', 'error');
      openAuthModal();
      return;
    }

    // Gather address and cart data
    const formData = new FormData(form);
    const addressPayload = {
      title: 'آدرس سفارش',
      recipientName: formData.get('fullName') || '',
      phone: formData.get('phone') || '',
      province: formData.get('province') || '',
      city: formData.get('city') || '',
      district: formData.get('district') || '',
      postalCode: formData.get('postalCode') || '',
      address: formData.get('address') || '',
      isDefault: true
    };
    const orderItems = cart.map(item => ({
      productId: item.id,
      quantity: item.quantity,
      color: item.color,
      size: item.size
    }));

    try {
      const { api } = window.NOQTEH_AUTH;
      // Create or reuse address
      const addressRes = await api('/addresses', { method: 'POST', body: JSON.stringify(addressPayload) });
      const addressId = addressRes.data.id;

      // Create order
      const orderRes = await api('/orders', {
        method: 'POST',
        body: JSON.stringify({ items: orderItems, addressId, note: formData.get('note') || '' })
      });
      const order = orderRes.data;

      const paymentMethod = formData.get('paymentMethod') || 'zarinpal';
      if (paymentMethod === 'zarinpal' && order.total > 0) {
        const payRes = await api('/payment/request', { method: 'POST', body: JSON.stringify({ orderId: order.id }) });
        if (payRes.data && payRes.data.gatewayUrl) {
          cart = [];
          saveCart();
          updateCartCount();
          window.location.href = payRes.data.gatewayUrl;
          return;
        }
      }

      // Cash on delivery or payment request failed
      cart = [];
      saveCart();
      updateCartCount();
      showNotification('سفارش شما ثبت شد.', 'success');
      setTimeout(() => window.location.href = 'account.html', 1500);
    } catch (err) {
      showNotification(err.message || 'خطا در ثبت سفارش', 'error');
    }
  });
}

// ========================================
// Newsletter
// ========================================
function initNewsletter() {
  const form = document.getElementById('newsletter-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!form.checkValidity()) {
      showNotification('لطفاً ایمیل معتبر وارد کنید', 'error');
      return;
    }
    showNotification('به خبرنامه NOQTEH خوش آمدید', 'success');
    form.reset();
  });
}

// ========================================
// Contact Form
// ========================================
function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!form.checkValidity()) {
      showNotification('لطفاً همه فیلدها را صحیح پر کنید', 'error');
      return;
    }
    showNotification('پیام شما ارسال شد. به زودی با شما تماس می‌گیریم.', 'success');
    form.reset();
  });
}

// ========================================
// Form Validation
// ========================================
function initFormValidation() {
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    form.addEventListener('submit', (e) => {
      if (!form.checkValidity()) {
        e.preventDefault();
        showNotification('لطفاً همه فیلدهای الزامی را پر کنید', 'error');
      }
    });
  });
}

// ========================================
// Page Transition
// ========================================
function initPageTransition() {
  let transition = document.querySelector('.page-transition');
  if (!transition) {
    transition = document.createElement('div');
    transition.className = 'page-transition';
    document.body.appendChild(transition);
  }

  window.addEventListener('load', () => {
    setTimeout(() => transition.classList.add('loaded'), 100);
  });

  document.querySelectorAll('a[href]').forEach(link => {
    const href = link.getAttribute('href');
    if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('http')) return;
    if (link.target === '_blank' || link.closest('.quick-add, .wishlist-btn, .quantity-controls, .side-nav-cart, .cart-btn')) return;

    link.addEventListener('click', (e) => {
      e.preventDefault();
      transition.classList.remove('loaded');
      setTimeout(() => window.location.href = href, 220);
    });
  });
}

// ========================================
// Auth Modal
// ========================================
function initAuthModal() {
  if (document.getElementById('auth-modal')) return;

  const STATIC_MODE = (typeof CONFIG !== 'undefined' && CONFIG.STATIC_MODE) ? true : false;

  const modal = document.createElement('div');
  modal.id = 'auth-modal';
  modal.className = 'auth-modal hidden';
  modal.innerHTML = `
    <div class="auth-modal-overlay"></div>
    <div class="auth-modal-content">
      <button class="auth-modal-close" aria-label="بستن">&times;</button>
      <h2 id="auth-title">ورود</h2>
      <div id="auth-static-msg" class="${STATIC_MODE ? '' : 'hidden'}" style="padding:12px;background:var(--color-bg-warm);margin-bottom:16px;color:var(--color-text-light);font-size:13px;">
        در نسخه آزمایشی آنلاین، ورود و ثبت‌نام از طریق سرور انجام می‌شود. این بخش فعلاً غیرفعال است.
      </div>
      <form id="auth-form">
        <div id="auth-name-fields" class="hidden">
          <input type="text" name="firstName" placeholder="نام">
          <input type="text" name="lastName" placeholder="نام خانوادگی">
        </div>
        <input type="email" name="email" placeholder="ایمیل" required>
        <input type="password" name="password" placeholder="رمز عبور" required minlength="6">
        <input type="tel" name="phone" placeholder="موبایل" class="hidden">
        <button type="submit" class="btn btn-dark" style="width:100%" ${STATIC_MODE ? 'disabled' : ''}>ادامه</button>
      </form>
      <p class="auth-toggle ${STATIC_MODE ? 'hidden' : ''}">
        <span id="auth-toggle-text">حساب کاربری ندارید؟</span>
        <button type="button" id="auth-toggle-btn">ثبت‌نام</button>
      </p>
      <p id="auth-error" class="error"></p>
    </div>
  `;
  document.body.appendChild(modal);

  if (STATIC_MODE) return;

  let mode = 'login';
  const form = modal.querySelector('#auth-form');
  const title = modal.querySelector('#auth-title');
  const toggleText = modal.querySelector('#auth-toggle-text');
  const toggleBtn = modal.querySelector('#auth-toggle-btn');
  const nameFields = modal.querySelector('#auth-name-fields');
  const phoneInput = modal.querySelector('input[name="phone"]');
  const error = modal.querySelector('#auth-error');

  function updateMode() {
    title.textContent = mode === 'login' ? 'ورود' : 'ثبت‌نام';
    toggleText.textContent = mode === 'login' ? 'حساب کاربری ندارید؟' : 'قبلاً ثبت‌نام کرده‌اید؟';
    toggleBtn.textContent = mode === 'login' ? 'ثبت‌نام' : 'ورود';
    nameFields.classList.toggle('hidden', mode === 'login');
    phoneInput.classList.toggle('hidden', mode === 'login');
    error.textContent = '';
  }

  modal.querySelector('.auth-modal-overlay').addEventListener('click', closeAuthModal);
  modal.querySelector('.auth-modal-close').addEventListener('click', closeAuthModal);
  toggleBtn.addEventListener('click', () => { mode = mode === 'login' ? 'register' : 'login'; updateMode(); });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    error.textContent = '';
    const data = Object.fromEntries(new FormData(form));
    try {
      if (mode === 'login') {
        await window.NOQTEH_AUTH.login(data.email, data.password);
      } else {
        await window.NOQTEH_AUTH.register({
          email: data.email,
          password: data.password,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone
        });
      }
      closeAuthModal();
      if (typeof updateAuthLinks === 'function') updateAuthLinks();
      showNotification(mode === 'login' ? 'خوش آمدید' : 'ثبت‌نام با موفقیت انجام شد', 'success');
    } catch (err) {
      error.textContent = err.message;
    }
  });

  // Open from URL param
  if (location.search.includes('login=1')) openAuthModal();
}

function openAuthModal() {
  const modal = document.getElementById('auth-modal');
  if (modal) modal.classList.remove('hidden');
}

function closeAuthModal() {
  const modal = document.getElementById('auth-modal');
  if (modal) modal.classList.add('hidden');
}

function updateAuthLinks() {
  if (typeof CONFIG !== 'undefined' && CONFIG.STATIC_MODE) {
    document.querySelectorAll('.auth-link').forEach(link => {
      link.textContent = 'حساب کاربری';
      link.href = 'account.html';
      link.onclick = null;
    });
    return;
  }
  const user = window.NOQTEH_AUTH ? window.NOQTEH_AUTH.getUser() : null;
  document.querySelectorAll('.auth-link').forEach(link => {
    link.textContent = user ? (user.firstName || user.email) : 'ورود / ثبت‌نام';
    link.href = user ? 'account.html' : '#';
    link.onclick = user ? null : (e) => { e.preventDefault(); openAuthModal(); };
  });
  document.querySelectorAll('.logout-link').forEach(link => {
    link.style.display = user ? 'inline-block' : 'none';
    link.onclick = (e) => { e.preventDefault(); window.NOQTEH_AUTH.logout(); };
  });
}

window.openAuthModal = openAuthModal;

// ========================================
// Initialize
// ========================================
document.addEventListener('DOMContentLoaded', async () => {
  updateCartCount();
  initHeaderScroll();
  initScrollReveal();
  initParallax();
  initBackToTop();
  initFormValidation();
  initContactForm();
  initShopFilters();
  initNewsletter();
  initPageTransition();
  initFullscreenMenu();
  initCartDrawer();
  initQuickView();
  initSizeGuide();
  initMarquee();
  initCustomCursor();
  initDarkMode();
  initStickyATC();
  initAuthModal();

  if (document.getElementById('product-detail')) await renderProductDetail();
  if (document.getElementById('cart-items')) renderCart();
  initCheckout();

  // Wait for auth then update links
  if (window.NOQTEH_AUTH) {
    await window.NOQTEH_AUTH.fetchUser();
    updateAuthLinks();
  }
});
