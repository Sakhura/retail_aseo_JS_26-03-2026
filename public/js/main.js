// public/js/main.js — Lógica frontend de RetailAseo
// Consume la API REST del backend para mostrar productos, gestionar el carrito
// y permitir registro/login/checkout al usuario.

const API = '/api';

// ── Estado global de la aplicación ──────────────────────────────────────
const state = {
  products:  [],
  cart:      JSON.parse(localStorage.getItem('cart') || '[]'),
  token:     localStorage.getItem('token') || null,
  user:      JSON.parse(localStorage.getItem('user')  || 'null'),
};

// ── Helpers de petición ──────────────────────────────────────────────────
async function apiFetch(endpoint, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (state.token) headers['Authorization'] = `Bearer ${state.token}`;

  const res  = await fetch(`${API}${endpoint}`, { ...options, headers });
  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
}

// ── Toast notification ───────────────────────────────────────────────────
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent  = message;
  toast.className    = `toast ${type} show`;
  setTimeout(() => toast.classList.remove('show'), 3200);
}

// ── Guardar/limpiar sesión ───────────────────────────────────────────────
function saveSession(token, user) {
  state.token = token;
  state.user  = user;
  localStorage.setItem('token', token);
  localStorage.setItem('user',  JSON.stringify(user));
  updateAuthButton();
}

function clearSession() {
  state.token = null;
  state.user  = null;
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  updateAuthButton();
}

function updateAuthButton() {
  const btn = document.getElementById('btnLogin');
  if (state.user) {
    btn.textContent = `👤 ${state.user.nombre.split(' ')[0]}`;
    btn.onclick = () => {
      if (confirm('¿Cerrar sesión?')) { clearSession(); showToast('Sesión cerrada.', 'warning'); }
    };
  } else {
    btn.textContent = 'Iniciar Sesión';
    btn.onclick = () => openModal('loginModal');
  }
}

// ── Modales ──────────────────────────────────────────────────────────────
function openModal(id)  { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

document.getElementById('closeCart').onclick  = () => closeModal('cartModal');
document.getElementById('closeLogin').onclick = () => closeModal('loginModal');
document.querySelectorAll('.modal-overlay').forEach(m =>
  m.addEventListener('click', e => { if (e.target === m) m.classList.remove('open'); })
);

// ── CARRITO ──────────────────────────────────────────────────────────────
function saveCart() { localStorage.setItem('cart', JSON.stringify(state.cart)); }

function addToCart(product) {
  const existing = state.cart.find(i => i.id === product.id);
  if (existing) {
    if (existing.qty >= product.stock) { showToast('Stock máximo alcanzado.', 'warning'); return; }
    existing.qty++;
  } else {
    state.cart.push({ id: product.id, nombre: product.nombre, precio: product.precio, qty: 1, stock: product.stock });
  }
  saveCart();
  updateCartCount();
  showToast(`"${product.nombre}" agregado al carrito.`);
}

function updateCartCount() {
  const total = state.cart.reduce((acc, i) => acc + i.qty, 0);
  document.getElementById('cartCount').textContent = total;
}

function renderCart() {
  const body   = document.getElementById('cartBody');
  const footer = document.getElementById('cartFooter');

  if (state.cart.length === 0) {
    body.innerHTML  = '<p class="empty-cart">Tu carrito está vacío.</p>';
    footer.style.display = 'none';
    return;
  }

  footer.style.display = 'flex';

  body.innerHTML = state.cart.map(item => `
    <div class="cart-item">
      <div class="cart-item-info">
        <div class="cart-item-name">${item.nombre}</div>
        <div class="cart-item-price">$${Number(item.precio).toLocaleString('es-CL')} c/u</div>
      </div>
      <div class="cart-item-controls">
        <button class="qty-btn" onclick="changeQty(${item.id}, -1)">−</button>
        <span class="qty-display">${item.qty}</span>
        <button class="qty-btn" onclick="changeQty(${item.id},  1)">+</button>
        <button class="cart-item-remove" onclick="removeFromCart(${item.id})">🗑</button>
      </div>
    </div>
  `).join('');

  const total = state.cart.reduce((acc, i) => acc + i.precio * i.qty, 0);
  document.getElementById('cartTotal').textContent = `$${total.toLocaleString('es-CL')}`;
}

window.changeQty = (id, delta) => {
  const item = state.cart.find(i => i.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) { removeFromCart(id); return; }
  if (item.qty > item.stock) { item.qty = item.stock; showToast('Stock máximo alcanzado.', 'warning'); }
  saveCart(); renderCart(); updateCartCount();
};

window.removeFromCart = (id) => {
  state.cart = state.cart.filter(i => i.id !== id);
  saveCart(); renderCart(); updateCartCount();
};

document.getElementById('cartBtn').onclick = () => { renderCart(); openModal('cartModal'); };

// Mostrar/ocultar campo dirección según tipo de entrega
document.querySelectorAll('[name="tipoEntrega"]').forEach(radio => {
  radio.addEventListener('change', e => {
    document.getElementById('addressSection').style.display =
      e.target.value === 'despacho' ? 'block' : 'none';
  });
});

// ── CHECKOUT ─────────────────────────────────────────────────────────────
document.getElementById('checkoutBtn').onclick = async () => {
  if (!state.token) {
    closeModal('cartModal');
    openModal('loginModal');
    showToast('Debes iniciar sesión para comprar.', 'warning');
    return;
  }

  const tipoEntrega    = document.querySelector('[name="tipoEntrega"]:checked').value;
  const direccionEntrega = document.getElementById('addressInput').value.trim();

  if (tipoEntrega === 'despacho' && !direccionEntrega) {
    showToast('Debes ingresar una dirección de entrega.', 'warning');
    return;
  }

  const payload = {
    tipoEntrega,
    direccionEntrega: tipoEntrega === 'despacho' ? direccionEntrega : null,
    items: state.cart.map(i => ({ productId: i.id, cantidad: i.qty })),
  };

  const { ok, data } = await apiFetch('/orders', {
    method: 'POST',
    body:   JSON.stringify(payload),
  });

  if (ok) {
    state.cart = [];
    saveCart();
    updateCartCount();
    closeModal('cartModal');
    showToast(`✅ Pedido #${data.data.id} confirmado. ¡Gracias por tu compra!`, 'success');
    loadProducts(); // Recargar para actualizar stock
  } else {
    showToast(data.message || 'Error al procesar el pedido.', 'error');
  }
};

// ── PRODUCTOS ────────────────────────────────────────────────────────────
function formatExpiry(dateStr) {
  if (!dateStr) return '';
  const today  = new Date(); today.setHours(0, 0, 0, 0);
  const expiry = new Date(dateStr + 'T00:00:00');
  const diff   = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

  if (diff < 0)   return `<span class="product-expiry expiry-expired">⛔ Vencido</span>`;
  if (diff <= 30) return `<span class="product-expiry expiry-soon">⚠️ Vence en ${diff} días</span>`;
  return `<span class="product-expiry expiry-ok">✅ Vigente</span>`;
}

function renderProducts(products) {
  const grid = document.getElementById('productsGrid');

  if (products.length === 0) {
    grid.innerHTML = '<p class="loading-msg">No se encontraron productos.</p>';
    return;
  }

  grid.innerHTML = products.map(p => {
    const imgContent = p.imagen
      ? `<img src="${p.imagen}" alt="${p.nombre}" />`
      : '🧴';

    return `
      <div class="product-card">
        <div class="product-img">${imgContent}</div>
        <div class="product-body">
          <span class="product-category">${p.category?.nombre || 'Sin categoría'}</span>
          <div class="product-name">${p.nombre}</div>
          ${p.descripcion ? `<div class="product-stock" style="color:var(--clr-gray-600);font-size:.85rem">${p.descripcion.substring(0,80)}${p.descripcion.length>80?'…':''}</div>` : ''}
          ${formatExpiry(p.fechaVencimiento)}
          <div class="product-price">$${Number(p.precio).toLocaleString('es-CL')}</div>
          <div class="product-stock">Stock: ${p.stock} unidades</div>
        </div>
        <div class="product-footer">
          <button
            class="btn btn-primary btn-sm btn-block"
            onclick='addToCart(${JSON.stringify({ id: p.id, nombre: p.nombre, precio: Number(p.precio), stock: p.stock })})'
            ${p.stock === 0 ? 'disabled' : ''}
          >
            ${p.stock === 0 ? 'Sin stock' : '🛒 Agregar'}
          </button>
        </div>
      </div>
    `;
  }).join('');
}

async function loadProducts() {
  const search    = document.getElementById('searchInput').value.trim();
  const category  = document.getElementById('categoryFilter').value;
  const hideExpired = document.getElementById('hideExpired').checked;

  let endpoint = '/products?';
  if (search)   endpoint += `search=${encodeURIComponent(search)}&`;
  if (category) endpoint += `category=${category}&`;

  const { ok, data } = await apiFetch(endpoint);

  if (!ok) { showToast('Error al cargar productos.', 'error'); return; }

  let products = data.data || [];

  // Filtrar vencidos en el frontend
  if (hideExpired) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    products = products.filter(p => {
      if (!p.fechaVencimiento) return true;
      return new Date(p.fechaVencimiento + 'T00:00:00') >= today;
    });
  }

  state.products = products;
  renderProducts(products);
}

async function loadCategories() {
  const { ok, data } = await apiFetch('/categories');
  if (!ok) return;

  const select = document.getElementById('categoryFilter');
  data.data.forEach(cat => {
    const opt = document.createElement('option');
    opt.value       = cat.id;
    opt.textContent = cat.nombre;
    select.appendChild(opt);
  });
}

// ── FILTROS ───────────────────────────────────────────────────────────────
let searchTimeout;
document.getElementById('searchInput').addEventListener('input', () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(loadProducts, 350); // debounce 350ms
});
document.getElementById('categoryFilter').addEventListener('change', loadProducts);
document.getElementById('hideExpired').addEventListener('change', loadProducts);

// ── AUTH FORMS ────────────────────────────────────────────────────────────
document.getElementById('goToRegister').onclick = (e) => {
  e.preventDefault();
  document.getElementById('loginForm').style.display    = 'none';
  document.getElementById('registerForm').style.display = 'block';
  document.getElementById('authModalTitle').textContent = 'Crear cuenta';
  document.getElementById('authMsg').textContent = '';
};

document.getElementById('goToLogin').onclick = (e) => {
  e.preventDefault();
  document.getElementById('registerForm').style.display = 'none';
  document.getElementById('loginForm').style.display    = 'block';
  document.getElementById('authModalTitle').textContent = 'Iniciar Sesión';
  document.getElementById('authMsg').textContent = '';
};

document.getElementById('submitLogin').onclick = async () => {
  const email    = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const msg      = document.getElementById('authMsg');

  if (!email || !password) { msg.textContent = 'Completa todos los campos.'; msg.className = 'auth-msg error'; return; }

  const { ok, data } = await apiFetch('/auth/login', {
    method: 'POST',
    body:   JSON.stringify({ email, password }),
  });

  if (ok) {
    saveSession(data.data.token, data.data.user);
    closeModal('loginModal');
    showToast(`¡Bienvenido/a, ${data.data.user.nombre}!`);
  } else {
    msg.textContent = data.message || 'Credenciales inválidas.';
    msg.className   = 'auth-msg error';
  }
};

document.getElementById('submitRegister').onclick = async () => {
  const nombre   = document.getElementById('regNombre').value.trim();
  const email    = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  const telefono = document.getElementById('regTelefono').value.trim();
  const msg      = document.getElementById('authMsg');

  if (!nombre || !email || !password) {
    msg.textContent = 'Nombre, email y contraseña son obligatorios.';
    msg.className   = 'auth-msg error';
    return;
  }

  const { ok, data } = await apiFetch('/auth/register', {
    method: 'POST',
    body:   JSON.stringify({ nombre, email, password, telefono }),
  });

  if (ok) {
    saveSession(data.data.token, data.data.user);
    closeModal('loginModal');
    showToast(`Cuenta creada. ¡Bienvenido/a, ${data.data.user.nombre}!`);
  } else {
    msg.textContent = data.message || 'Error al registrar.';
    msg.className   = 'auth-msg error';
  }
};

// ── VERIFICAR ESTADO DEL SERVIDOR ─────────────────────────────────────────
async function checkServerStatus() {
  try {
    const res = await fetch('/status');
    const ok  = res.ok;
    document.getElementById('serverStatus').innerHTML =
      ok ? '<span class="ok">✓ Servidor operativo</span>'
         : '<span class="fail">✗ Sin conexión</span>';
  } catch {
    document.getElementById('serverStatus').innerHTML = '<span class="fail">✗ Sin conexión</span>';
  }
}

// ── INICIALIZAR ───────────────────────────────────────────────────────────
(async function init() {
  updateAuthButton();
  updateCartCount();
  await checkServerStatus();
  await loadCategories();
  await loadProducts();
})();