(function() {
  const storageKey = 'perfume_cosmos_cart_v1';
  let cart = loadCart();

  function loadCart() {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }
  function saveCart() {
    localStorage.setItem(storageKey, JSON.stringify(cart));
    renderCartBadge();
  }

  function formatCurrency(n) { return `$${n.toFixed(2)}`; }

  function renderCartBadge() {
    const el = document.getElementById('cart-count');
    if (el) el.textContent = String(cart.reduce((s, i) => s + i.qty, 0));
  }

  function openCart() {
    const drawer = document.getElementById('cart-drawer');
    const overlay = document.getElementById('overlay');
    if (!drawer || !overlay) return;
    drawer.classList.add('show');
    drawer.setAttribute('aria-hidden', 'false');
    overlay.classList.add('show');
    overlay.setAttribute('aria-hidden', 'false');
    renderCartList();
  }
  function closeCart() {
    const drawer = document.getElementById('cart-drawer');
    const overlay = document.getElementById('overlay');
    if (!drawer || !overlay) return;
    drawer.classList.remove('show');
    drawer.setAttribute('aria-hidden', 'true');
    overlay.classList.remove('show');
    overlay.setAttribute('aria-hidden', 'true');
  }

  function renderCartList() {
    const itemsEl = document.getElementById('cart-items');
    const totalEl = document.getElementById('cart-total');
    if (!itemsEl || !totalEl) return;
    itemsEl.innerHTML = '';
    let total = 0;
    for (const item of cart) {
      total += item.price * item.qty;
      const row = document.createElement('div');
      row.className = 'cart-item';
      row.innerHTML = `
        <img src="${item.image}" alt="${item.name}">
        <div class="meta">
          <strong>${item.name}</strong>
          <span>${formatCurrency(item.price)}</span>
          <div class="qty">
            <button data-action="dec">-</button>
            <span>${item.qty}</span>
            <button data-action="inc">+</button>
            <button data-action="rm" style="margin-left:8px;color:#ff6b6b">Remove</button>
          </div>
        </div>
        <div><strong>${formatCurrency(item.price * item.qty)}</strong></div>
      `;
      row.querySelector('[data-action="dec"]').addEventListener('click', () => updateQty(item.id, -1));
      row.querySelector('[data-action="inc"]').addEventListener('click', () => updateQty(item.id, +1));
      row.querySelector('[data-action="rm"]').addEventListener('click', () => removeItem(item.id));
      itemsEl.appendChild(row);
    }
    totalEl.textContent = formatCurrency(total);
  }

  function updateQty(id, delta) {
    const next = [];
    for (const it of cart) {
      if (it.id === id) {
        const qty = Math.max(0, it.qty + delta);
        if (qty > 0) next.push({ ...it, qty });
      } else next.push(it);
    }
    cart = next;
    saveCart();
    renderCartList();
  }
  function removeItem(id) {
    cart = cart.filter(it => it.id !== id);
    saveCart();
    renderCartList();
  }

  function addToCart(product) {
    const existing = cart.find(i => i.id === product.id);
    if (existing) existing.qty += product.qty ?? 1; else cart.push({ ...product, qty: product.qty ?? 1 });
    saveCart();
  }

  // Bind cart buttons
  document.addEventListener('DOMContentLoaded', () => {
    const cartBtn = document.getElementById('cart-button');
    const closeBtn = document.getElementById('cart-close');
    const overlay = document.getElementById('overlay');
    if (cartBtn) cartBtn.addEventListener('click', openCart);
    if (closeBtn) closeBtn.addEventListener('click', closeCart);
    if (overlay) overlay.addEventListener('click', closeCart);
    renderCartBadge();
    initStarfield();
    initParallax();
    initDraggables();
    wireProductCards();
    wireAuthForms();
  });

  // Starfield generation for hero
  function initStarfield() {
    const container = document.getElementById('starfield');
    if (!container) return;
    const count = 160;
    let html = '';
    for (let i = 0; i < count; i++) {
      const left = Math.random() * 100;
      const top = Math.random() * 100;
      const size = Math.random() * 2 + 0.5;
      const delay = Math.random() * 6;
      html += `<span style="position:absolute;left:${left}%;top:${top}%;width:${size}px;height:${size}px;background:#fff;border-radius:50%;opacity:${0.6 + Math.random() * 0.4}; filter: drop-shadow(0 0 6px rgba(255,255,255,0.6)); animation: twinkle 6s ease-in-out ${delay}s infinite;"></span>`;
    }
    container.innerHTML = html;
  }

  // Parallax scroll
  function initParallax() {
    const layers = Array.from(document.querySelectorAll('.parallax-layer'));
    if (!layers.length) return;
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      layers.forEach((layer, i) => {
        const factor = (i + 1) * 0.08;
        layer.style.transform = `translate3d(0, ${y * factor}px, 0)`;
      });
    }, { passive: true });
  }

  // Draggable widgets
  function initDraggables() {
    const widgets = document.querySelectorAll('[data-draggable]');
    widgets.forEach(w => {
      let startX = 0, startY = 0, x = 0, y = 0, dragging = false;
      const onDown = (e) => {
        dragging = true; w.style.transition = 'none';
        const p = getPoint(e); startX = p.x - x; startY = p.y - y;
      };
      const onMove = (e) => {
        if (!dragging) return; const p = getPoint(e); x = p.x - startX; y = p.y - startY;
        w.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      };
      const onUp = () => { dragging = false; w.style.transition = ''; };
      w.addEventListener('mousedown', onDown); document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp);
      w.addEventListener('touchstart', onDown, { passive: true }); document.addEventListener('touchmove', onMove, { passive: true }); document.addEventListener('touchend', onUp);
    });
    function getPoint(e) { return e.touches ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : { x: e.clientX, y: e.clientY }; }
  }

  // Wire add to cart on product cards
  function wireProductCards() {
    document.querySelectorAll('[data-add-to-cart]').forEach(btn => {
      btn.addEventListener('click', () => {
        const data = btn.closest('[data-product]');
        if (!data) return;
        const product = {
          id: data.getAttribute('data-id'),
          name: data.getAttribute('data-name'),
          price: Number(data.getAttribute('data-price') || '0'),
          image: data.getAttribute('data-image') || 'https://picsum.photos/seed/perfume/80/80',
          qty: 1,
        };
        addToCart(product);
        openCart();
      });
    });
  }

  // Simple auth forms validation
  function wireAuthForms() {
    const login = document.querySelector('form[data-form="login"]');
    const signup = document.querySelector('form[data-form="signup"]');
    if (login) bindForm(login, ['email', 'password']);
    if (signup) bindForm(signup, ['name', 'email', 'password', 'confirm']);

    function bindForm(form, fields) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(form).entries());
        const errors = [];
        if (fields.includes('name') && (!data.name || String(data.name).trim().length < 2)) errors.push('Name must be at least 2 characters.');
        if (fields.includes('email') && !String(data.email||'').match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) errors.push('Valid email required.');
        if (fields.includes('password') && String(data.password||'').length < 6) errors.push('Password must be 6+ characters.');
        if (fields.includes('confirm') && data.password !== data.confirm) errors.push('Passwords must match.');
        const out = form.querySelector('[data-errors]');
        if (out) out.innerHTML = '';
        if (errors.length) {
          if (out) out.innerHTML = errors.map(e => `<div style='color:#ff6b6b'>${e}</div>`).join('');
          return;
        }
        form.classList.add('submitting');
        setTimeout(() => {
          form.classList.remove('submitting');
          if (out) out.innerHTML = `<div style='color:#35d399'>Success!</div>`;
          window.location.href = '/perfume-cosmos/index.html';
        }, 800);
      });
    }
  }

  // Export for inline buttons on pages
  window.PerfumeCosmos = { addToCart };
})();

// Additional animations
const style = document.createElement('style');
style.innerHTML = `
@keyframes twinkle { 0%, 100% { opacity: .6; transform: scale(1); } 50% { opacity: 1; transform: scale(1.3); } }
`;
document.head.appendChild(style);