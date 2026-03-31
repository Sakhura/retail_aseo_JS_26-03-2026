// logica frontend js
const api = '/api'

// estado global 

let cart = JSON.parse(localStorage.getItem('cart') || '[]');
let token = localStorage.getItem('token') || null;
let currentUser = JSON.parse(localStorage.getItem('user') || 'null');

//helper
async function apiFetch(url, options = {}) {
    const headers = { 'Content-Type': 'aplication/json',  ...options.headers };
    if (token) headers['Authorization'] = `Beader ${token}`;
    const res = await fetch(url, { ...options, headers});
    const data = await res.json();
    if(!res.ok) throw new Error(data.message || 'Error en la conexión');
    return data;
}

// notificaciones toast
function showToast(msg, type = '') {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.className = `toast shoe ${type}`;
    setTimeout(()=> {t.className = 'toast'; }, 3200);
}

// usd a clp
const formatPrice = (n) =>
    new Intl.NumberFormat('es-CL', { 
        style : 'currency',
        currency : 'CLP'
    }).format(n);

// calcular el vcto de los productos
function expiryBadge(product) {
    if(!product_tiene_vencimiento || !product.fecha_vencimiento);
    const exp = new Date(product.fecha_vencimiento);
    const days = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
    if(days < 0) return `<span class = "product-expiry expiry-expired">Vencido</span>`;
    if(days <= 30) return `<span class = "product-expiry expiry-soon">Vence en ${days} días</span>`;
    return `<span class = "product-expiry expiry-ok">Vence en ${exp.toLocaleDateString('es-CL')} </span>`;
}

//status servidor
async function checkServerStatus() {
    const el = document.getElementById('serverStatus');
    try{
        const data = await fetch('/status').then((r) => r.json);
        el.innerHTML = `<span class = "ok"> ${data.message}</span>`
    }catch{
        el.innerHTML = `<span class = "fail"> Servidor No disponible</span>`
    
    }
}

//  AUTENTICACIÓN 
function updateAuthUI() {
  const btn = document.getElementById('btnLogin');
  if (currentUser) {
    btn.textContent = ` ${currentUser.nombre.split(' ')[0]}`;
    btn.onclick = () => {
      token = null; currentUser = null;
      localStorage.removeItem('token'); localStorage.removeItem('user');
      updateAuthUI();
      showToast('Sesión cerrada');
    };
  } else {
    btn.textContent = 'Iniciar Sesión';
    btn.onclick = openLoginModal;
  }
}

function openLoginModal() {
  document.getElementById('loginModal').classList.add('open');
  document.getElementById('loginForm').style.display = '';
  document.getElementById('registerForm').style.display = 'none';
  document.getElementById('authModalTitle').textContent = 'Iniciar Sesión';
  document.getElementById('authMsg').textContent = '';
}

document.getElementById('closeLogin').onclick = () =>
  document.getElementById('loginModal').classList.remove('open');

document.getElementById('goToRegister').onclick = (e) => {
  e.preventDefault();
  document.getElementById('loginForm').style.display = 'none';
  document.getElementById('registerForm').style.display = '';
  document.getElementById('authModalTitle').textContent = 'Crear cuenta';
};
document.getElementById('goToLogin').onclick = (e) => {
  e.preventDefault();
  document.getElementById('registerForm').style.display = 'none';
  document.getElementById('loginForm').style.display = '';
  document.getElementById('authModalTitle').textContent = 'Iniciar Sesión';
};

// Login
document.getElementById('submitLogin').onclick = async () => {
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const msg = document.getElementById('authMsg');
  if (!email || !password) { msg.textContent = 'Completa todos los campos'; msg.className = 'auth-msg error'; return; }
  try {
    const res = await apiFetch(`${API}/auth/login`, {
      method: 'POST', body: JSON.stringify({ email, password }),
    });
    token = res.data.token; currentUser = res.data.usuario;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(currentUser));
    document.getElementById('loginModal').classList.remove('open');
    updateAuthUI();
    showToast(`¡Bienvenido, ${currentUser.nombre}!`, 'success');
  } catch (err) {
    msg.textContent = err.message; msg.className = 'auth-msg error';
  }
};

// Registro
document.getElementById('submitRegister').onclick = async () => {
  const nombre = document.getElementById('regNombre').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  const telefono = document.getElementById('regTelefono').value.trim();
  const msg = document.getElementById('authMsg');
  if (!nombre || !email || !password) { msg.textContent = 'Nombre, email y contraseña son obligatorios'; msg.className = 'auth-msg error'; return; }
  try {
    await apiFetch(`${API}/auth/register`, {
      method: 'POST', body: JSON.stringify({ nombre, email, password, telefono }),
    });
    msg.textContent = '¡Cuenta creada! Ahora inicia sesión.'; msg.className = 'auth-msg success';
    setTimeout(() => {
      document.getElementById('registerForm').style.display = 'none';
      document.getElementById('loginForm').style.display = '';
      document.getElementById('authModalTitle').textContent = 'Iniciar Sesión';
      document.getElementById('loginEmail').value = email;
    }, 1500);
  } catch (err) {
    msg.textContent = err.message; msg.className = 'auth-msg error';
  }
};

//  CATÁLOGO DE PRODUCTOS 
async function loadCategories() {
  try {
    const res = await apiFetch(`${API}/categories`);
    const sel = document.getElementById('categoryFilter');
    res.data.forEach((cat) => {
      const opt = document.createElement('option');
      opt.value = cat.id; opt.textContent = cat.nombre;
      sel.appendChild(opt);
    });
  } catch { /* silencioso */ }
}

async function loadProducts() {
  const grid = document.getElementById('productsGrid');
  grid.innerHTML = '<p class="loading-msg">Cargando productos…</p>';

  const nombre = document.getElementById('searchInput').value.trim();
  const categoria = document.getElementById('categoryFilter').value;
  const hideExpired = document.getElementById('hideExpired').checked;

  const params = new URLSearchParams();
  if (nombre) params.set('nombre', nombre);
  if (categoria) params.set('categoria', categoria);
  if (hideExpired) params.set('vencidos', 'false');

  try {
    const res = await apiFetch(`${API}/products?${params}`);
    const products = res.data;

    if (!products.length) {
      grid.innerHTML = '<p class="loading-msg">No se encontraron productos.</p>';
      return;
    }

    grid.innerHTML = products.map((p) => {
      const imgContent = p.imagen
        ? `<img src="${p.imagen}" alt="${p.nombre}" loading="lazy" />`
        : '🧴';
      const expiry = expiryBadge(p);
      const outOfStock = p.stock === 0;
      return `
        <div class="product-card" data-id="${p.id}">
          <div class="product-img">${imgContent}</div>
          <div class="product-body">
            <span class="product-category">${p.categoria?.nombre || ''}</span>
            <h3 class="product-name">${p.nombre}</h3>
            ${expiry}
            <div class="product-price">${formatPrice(p.precio)}</div>
            <span class="product-stock">${outOfStock ? '❌ Sin stock' : `Stock: ${p.stock}`}</span>
          </div>
          <div class="product-footer">
            <button
              class="btn btn-primary btn-block add-cart-btn"
              data-id="${p.id}" data-name="${p.nombre}" data-price="${p.precio}"
              ${outOfStock ? 'disabled style="opacity:.5;cursor:not-allowed"' : ''}
            >
              ${outOfStock ? 'Sin stock' : '🛒 Agregar'}
            </button>
          </div>
        </div>`;
    }).join('');

    // Eventos de los botones "Agregar al carrito"
    grid.querySelectorAll('.add-cart-btn:not([disabled])').forEach((btn) => {
      btn.onclick = () => addToCart(btn.dataset.id, btn.dataset.name, parseFloat(btn.dataset.price));
    });
  } catch (err) {
    grid.innerHTML = `<p class="loading-msg">⚠️ Error: ${err.message}</p>`;
  }
}

// Buscar al escribir (debounce)
let searchTimer;
document.getElementById('searchInput').addEventListener('input', () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(loadProducts, 400);
});
document.getElementById('categoryFilter').addEventListener('change', loadProducts);
document.getElementById('hideExpired').addEventListener('change', loadProducts);

//  CARRITO 
function addToCart(id, name, price) {
  const existing = cart.find((i) => i.id === id);
  if (existing) { existing.qty++; }
  else { cart.push({ id, name, price, qty: 1 }); }
  saveCart();
  updateCartCount();
  showToast(`"${name}" agregado al carrito`, 'success');
}

function saveCart() { localStorage.setItem('cart', JSON.stringify(cart)); }

function updateCartCount() {
  const total = cart.reduce((s, i) => s + i.qty, 0);
  document.getElementById('cartCount').textContent = total;
}

function renderCart() {
  const body = document.getElementById('cartBody');
  const footer = document.getElementById('cartFooter');

  if (!cart.length) {
    body.innerHTML = '<p class="empty-cart">Tu carrito está vacío.</p>';
    footer.style.display = 'none';
    return;
  }

  footer.style.display = '';
  body.innerHTML = cart.map((item) => `
    <div class="cart-item" data-id="${item.id}">
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">${formatPrice(item.price)} c/u</div>
      </div>
      <div class="cart-item-controls">
        <button class="qty-btn" data-action="dec" data-id="${item.id}">−</button>
        <span class="qty-display">${item.qty}</span>
        <button class="qty-btn" data-action="inc" data-id="${item.id}">+</button>
      </div>
      <button class="cart-item-remove" data-id="${item.id}">🗑</button>
    </div>
  `).join('');

  // Total
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  document.getElementById('cartTotal').textContent = formatPrice(total);

  // Eventos de cantidad y eliminar
  body.querySelectorAll('.qty-btn').forEach((btn) => {
    btn.onclick = () => changeQty(btn.dataset.id, btn.dataset.action);
  });
  body.querySelectorAll('.cart-item-remove').forEach((btn) => {
    btn.onclick = () => removeFromCart(btn.dataset.id);
  });
}

function changeQty(id, action) {
  const item = cart.find((i) => i.id === id);
  if (!item) return;
  if (action === 'inc') { item.qty++; }
  else { item.qty--; if (item.qty <= 0) cart = cart.filter((i) => i.id !== id); }
  saveCart(); updateCartCount(); renderCart();
}

function removeFromCart(id) {
  cart = cart.filter((i) => i.id !== id);
  saveCart(); updateCartCount(); renderCart();
}

// Abrir / cerrar carrito
document.getElementById('cartBtn').onclick = () => {
  renderCart();
  document.getElementById('cartModal').classList.add('open');
};
document.getElementById('closeCart').onclick = () =>
  document.getElementById('cartModal').classList.remove('open');

// Mostrar / ocultar campo dirección según tipo de entrega
document.querySelectorAll('input[name="tipoEntrega"]').forEach((radio) => {
  radio.addEventListener('change', () => {
    document.getElementById('addressSection').style.display =
      radio.value === 'despacho' ? '' : 'none';
  });
});

//  CHECKOUT 
document.getElementById('checkoutBtn').onclick = async () => {
  if (!token) {
    document.getElementById('cartModal').classList.remove('open');
    openLoginModal();
    showToast('Debes iniciar sesión para confirmar el pedido', 'warning');
    return;
  }

  const tipoEntrega = document.querySelector('input[name="tipoEntrega"]:checked').value;
  const direccion = document.getElementById('addressInput').value.trim();

  if (tipoEntrega === 'despacho' && !direccion) {
    showToast('Ingresa la dirección de despacho', 'error'); return;
  }

  const items = cart.map((i) => ({ producto_id: i.id, cantidad: i.qty }));

  try {
    const res = await apiFetch(`${API}/orders`, {
      method: 'POST',
      body: JSON.stringify({
        tipo_entrega: tipoEntrega,
        items,
        direccion_entrega: tipoEntrega === 'despacho' ? direccion : undefined,
      }),
    });
    cart = []; saveCart(); updateCartCount();
    document.getElementById('cartModal').classList.remove('open');
    showToast(`✅ Pedido #${res.data.id} creado. Total: ${formatPrice(res.data.total)}`, 'success');
    loadProducts(); // Actualizar stock en la vista
  } catch (err) {
    showToast(`Error: ${err.message}`, 'error');
  }
};

// Cerrar modales al hacer click en el overlay
document.querySelectorAll('.modal-overlay').forEach((overlay) => {
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.classList.remove('open');
  });
});

//  INICIO 
(async function init() {
  checkServerStatus();
  updateAuthUI();
  updateCartCount();
  await loadCategories();
  await loadProducts();
})();
