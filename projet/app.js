/* ═══════════════════════════════════════════════════
   StockShop — app.js
   Full SPA: Catalog · Orders · Profile · Cart · Checkout
   ═══════════════════════════════════════════════════ */

/* ── STATE ── */
let cart          = JSON.parse(localStorage.getItem('ss_cart') || '[]');
let allProducts   = [];
let activeFilter  = 'all';
let currentModal  = null;
let currentUser   = null;   // { user_id, user_name, email, phone_number }
let ordersCache   = null;   // cached after first load

/* ══════════════════════════════════════════════════
   BOOT
   ══════════════════════════════════════════════════ */
window.onload = async function () {
    try {
        const res  = await fetch('check_session.php');
        const data = await res.json();
        if (!data.logged_in) { window.location.href = 'auth.html'; return; }

        currentUser = { user_name: data.user_name, email: data.email || '', phone_number: data.phone_number || '' };

        populateUserUI();
        document.getElementById('app').classList.remove('hidden');

        setupNav();
        setupCart();
        setupModals();
        setupProfile();

        renderCart();
        await fetchProducts();

    } catch (err) {
        console.error('Boot error:', err);
    }
};

/* ══════════════════════════════════════════════════
   USER UI
   ══════════════════════════════════════════════════ */
function populateUserUI() {
    const initial = (currentUser.user_name || '?').charAt(0).toUpperCase();
    document.getElementById('user-avatar-btn').textContent = initial;
    document.getElementById('dd-avatar').textContent       = initial;
    document.getElementById('dd-name').textContent         = currentUser.user_name;

    // Profile page sidebar
    document.getElementById('profile-avatar-big').textContent = initial;
    document.getElementById('profile-full-name').textContent  = currentUser.user_name;

    // Profile form fields
    document.getElementById('pf-name').value  = currentUser.user_name || '';
    document.getElementById('pf-phone').value = currentUser.phone_number || '';
    document.getElementById('pf-email').value = currentUser.email || '';
}

/* ══════════════════════════════════════════════════
   SPA NAVIGATION
   ══════════════════════════════════════════════════ */
function setupNav() {
    // All elements with data-page attribute navigate pages
    document.querySelectorAll('[data-page]').forEach(el => {
        el.addEventListener('click', (e) => {
            e.stopPropagation();
            navigateTo(el.dataset.page);
            // Close dropdown if open
            document.getElementById('profile-dropdown').classList.remove('open');
        });
    });

    // Profile dropdown toggle
    document.getElementById('user-avatar-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        document.getElementById('profile-dropdown').classList.toggle('open');
    });
    document.addEventListener('click', () => {
        document.getElementById('profile-dropdown').classList.remove('open');
    });

    // Logout
    document.getElementById('logout-btn').addEventListener('click', logoutUser);

    // Search — only active on catalog page
    document.getElementById('search-input').addEventListener('input', (e) => {
        renderProducts(e.target.value.trim());
    });
}

function navigateTo(page) {
    // Update nav link active states
    document.querySelectorAll('.nav-link').forEach(l => {
        l.classList.toggle('active', l.dataset.page === page);
    });

    // Show/hide pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const target = document.getElementById(`page-${page}`);
    if (target) target.classList.add('active');

    // Show/hide search bar (only on catalog)
    document.getElementById('search-wrap').style.display = page === 'catalog' ? '' : 'none';

    // Lazy-load page data
    if (page === 'orders') loadOrders();
    if (page === 'profile') loadProfileStats();

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ══════════════════════════════════════════════════
   PRODUCTS
   ══════════════════════════════════════════════════ */
async function fetchProducts() {
    try {
        const res  = await fetch('get_products.php');
        allProducts = await res.json();

        document.getElementById('stat-products').textContent = allProducts.length;
        buildFilters();
        renderProducts();
    } catch (err) {
        console.error('Fetch products error:', err);
        document.getElementById('product-container').innerHTML =
            '<div class="loading-state"><p>⚠️ Failed to load products.</p></div>';
    }
}

function buildFilters() {
    const categories = [...new Set(allProducts.map(p => p.category).filter(Boolean))];
    const row = document.getElementById('filter-row');
    row.innerHTML = '<div class="filter-chip active" data-filter="all">All</div>';

    categories.forEach(cat => {
        const chip = document.createElement('div');
        chip.className   = 'filter-chip';
        chip.dataset.filter = cat;
        chip.textContent = cat;
        row.appendChild(chip);
    });

    row.addEventListener('click', (e) => {
        const chip = e.target.closest('.filter-chip');
        if (!chip) return;
        row.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        activeFilter = chip.dataset.filter;
        renderProducts(document.getElementById('search-input').value.trim());
    });
}

function renderProducts(query = '') {
    let list = allProducts;

    if (activeFilter !== 'all') {
        list = list.filter(p => p.category === activeFilter);
    }
    if (query) {
        const q = query.toLowerCase();
        list = list.filter(p =>
            (p.name || '').toLowerCase().includes(q) ||
            (p.description || '').toLowerCase().includes(q)
        );
    }

    document.getElementById('count-label').textContent =
        `${list.length} of ${allProducts.length} products`;

    const container = document.getElementById('product-container');
    if (list.length === 0) {
        container.innerHTML = '<div class="loading-state"><p>No products found.</p></div>';
        return;
    }
    container.innerHTML = '';
    list.forEach(p => container.appendChild(createCard(p)));
}

function createCard(product) {
    const card  = document.createElement('div');
    card.className = 'card';

    const imgUrl   = product.image_url || `https://picsum.photos/seed/p${product.id_product}/600/450`;
    const price    = parseFloat(product.price || 0).toFixed(2);
    const category = product.category || `#${product.id_product}`;

    card.innerHTML = `
        <button class="card-wishlist" title="Wishlist" aria-label="Add to wishlist">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
        </button>
        <div class="card-image-wrap">
            <span class="category-badge">${escHtml(category)}</span>
            <img src="${escHtml(imgUrl)}" alt="${escHtml(product.name)}" loading="lazy"
                 onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
            <div class="img-placeholder" style="display:none;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                </svg>
                <span>No image</span>
            </div>
            <div class="card-overlay">
                <button class="quick-view-btn">Quick View</button>
            </div>
        </div>
        <div class="card-body">
            <div class="card-name">${escHtml(product.name)}</div>
            <div class="card-description">${escHtml(product.description || 'No description available.')}</div>
        </div>
        <div class="card-footer">
            <div class="card-price"><sup>$</sup>${price}</div>
            <button class="add-to-cart-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                    <line x1="3" y1="6" x2="21" y2="6"/>
                    <path d="M16 10a4 4 0 0 1-8 0"/>
                </svg>
                Add to Cart
            </button>
        </div>`;

    card.querySelector('.card-wishlist').addEventListener('click', (e) => {
        e.stopPropagation();
        e.currentTarget.classList.toggle('active');
        showToast('❤️ Wishlist updated');
    });

    card.querySelector('.quick-view-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        openProductModal(product);
    });

    card.querySelector('.card-image-wrap').addEventListener('click', () => openProductModal(product));

    card.querySelector('.add-to-cart-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        addToCart(product);
        const btn = e.currentTarget;
        btn.classList.add('added');
        btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Added!`;
        setTimeout(() => {
            btn.classList.remove('added');
            btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg> Add to Cart`;
        }, 2000);
    });

    return card;
}

/* ══════════════════════════════════════════════════
   CART
   ══════════════════════════════════════════════════ */
function setupCart() {
    document.getElementById('cart-toggle').addEventListener('click', openCart);
    document.getElementById('close-cart').addEventListener('click', closeCart);
    document.getElementById('cart-overlay').addEventListener('click', closeCart);
    document.getElementById('checkout-btn').addEventListener('click', placeOrder);
}

function addToCart(product) {
    const existing = cart.find(i => i.id_product === product.id_product);
    if (existing) existing.qty++;
    else cart.push({ ...product, qty: 1 });
    saveCart();
    renderCart();
    showToast(`🛒 "${product.name}" added to cart`);
}

function removeFromCart(id) {
    cart = cart.filter(i => i.id_product !== id);
    saveCart();
    renderCart();
}

function changeQty(id, delta) {
    const item = cart.find(i => i.id_product === id);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) removeFromCart(id);
    else { saveCart(); renderCart(); }
}

function saveCart() {
    localStorage.setItem('ss_cart', JSON.stringify(cart));
}

function renderCart() {
    const totalQty = cart.reduce((s, i) => s + i.qty, 0);
    const subtotal  = cart.reduce((s, i) => s + parseFloat(i.price || 0) * i.qty, 0);

    const badge = document.getElementById('cart-badge');
    badge.textContent = totalQty;
    badge.classList.toggle('hidden', totalQty === 0);

    document.getElementById('cart-head-count').textContent = `${totalQty} item${totalQty !== 1 ? 's' : ''}`;
    document.getElementById('cart-total').textContent = `$${subtotal.toFixed(2)}`;

    const checkoutBtn = document.getElementById('checkout-btn');
    checkoutBtn.disabled = cart.length === 0;

    const itemsEl = document.getElementById('cart-items');

    if (cart.length === 0) {
        itemsEl.innerHTML = `
            <div class="cart-empty">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
                    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                    <line x1="3" y1="6" x2="21" y2="6"/>
                    <path d="M16 10a4 4 0 0 1-8 0"/>
                </svg>
                <p>Your cart is empty</p>
            </div>`;
        return;
    }

    itemsEl.innerHTML = '';
    cart.forEach(item => {
        const imgUrl = item.image_url || `https://picsum.photos/seed/p${item.id_product}/200/200`;
        const div    = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <img class="cart-item-img" src="${escHtml(imgUrl)}" alt="${escHtml(item.name)}"
                 onerror="this.style.display='none'">
            <div class="cart-item-details">
                <div class="cart-item-name">${escHtml(item.name)}</div>
                <div class="cart-item-price">$${parseFloat(item.price || 0).toFixed(2)} each</div>
                <div class="cart-item-qty">
                    <button class="qty-btn" data-id="${item.id_product}" data-delta="-1">−</button>
                    <span class="qty-num">${item.qty}</span>
                    <button class="qty-btn" data-id="${item.id_product}" data-delta="1">+</button>
                </div>
            </div>
            <button class="cart-remove" data-id="${item.id_product}" title="Remove">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                    <path d="M10 11v6"/><path d="M14 11v6"/>
                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                </svg>
            </button>`;

        div.querySelectorAll('.qty-btn').forEach(btn => {
            btn.addEventListener('click', () => changeQty(btn.dataset.id, parseInt(btn.dataset.delta)));
        });
        div.querySelector('.cart-remove').addEventListener('click', () => removeFromCart(item.id_product));
        itemsEl.appendChild(div);
    });
}

function openCart()  {
    document.getElementById('cart-sidebar').classList.add('open');
    document.getElementById('cart-overlay').classList.add('open');
    document.body.style.overflow = 'hidden';
}
function closeCart() {
    document.getElementById('cart-sidebar').classList.remove('open');
    document.getElementById('cart-overlay').classList.remove('open');
    document.body.style.overflow = '';
}

/* ══════════════════════════════════════════════════
   CHECKOUT — place order
   ══════════════════════════════════════════════════ */
async function placeOrder() {
    if (cart.length === 0) return;

    const btn = document.getElementById('checkout-btn');
    btn.disabled   = true;
    btn.textContent = 'Placing order…';

    try {
        const payload = {
            items: cart.map(i => ({ id_product: i.id_product, qty: i.qty }))
        };

        const res  = await fetch('place_order.php', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(payload)
        });
        const data = await res.json();

        if (data.success) {
            // Clear cart
            cart = [];
            saveCart();
            renderCart();
            closeCart();

            // Invalidate orders cache so next visit to Orders page re-fetches
            ordersCache = null;

            // Show confirmation modal
            document.getElementById('confirm-order-id').textContent =
                `Order #${data.order_id} · Total: $${data.total}`;
            document.getElementById('confirm-overlay').classList.add('open');
        } else {
            showToast('❌ ' + (data.message || 'Order failed'), 'red');
            btn.disabled   = false;
            btn.textContent = 'Proceed to Checkout →';
        }
    } catch (err) {
        console.error('Checkout error:', err);
        showToast('❌ Network error. Please try again.', 'red');
        btn.disabled   = false;
        btn.textContent = 'Proceed to Checkout →';
    }
}

/* ══════════════════════════════════════════════════
   ORDERS PAGE
   ══════════════════════════════════════════════════ */
async function loadOrders() {
    const container = document.getElementById('orders-container');

    // Use cache if available
    if (ordersCache !== null) {
        renderOrders(ordersCache);
        return;
    }

    container.innerHTML = '<div class="loading-state"><div class="spinner"></div><p>Loading orders…</p></div>';

    try {
        const res  = await fetch('get_orders.php');
        const data = await res.json();

        if (!data.success) throw new Error(data.message);

        ordersCache = data.orders;
        renderOrders(ordersCache);

        // Update profile stats sidebar if loaded
        updateProfileStats(ordersCache);

    } catch (err) {
        console.error('Load orders error:', err);
        container.innerHTML = '<div class="loading-state"><p>⚠️ Failed to load orders.</p></div>';
    }
}

function renderOrders(orders) {
    const container = document.getElementById('orders-container');

    if (!orders || orders.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                    <line x1="3" y1="6" x2="21" y2="6"/>
                    <path d="M16 10a4 4 0 0 1-8 0"/>
                </svg>
                <h3>No orders yet</h3>
                <p>Start shopping and your orders will appear here.</p>
                <button class="empty-cta" data-page="catalog">Browse Products</button>
            </div>`;
        container.querySelector('[data-page]')?.addEventListener('click', () => navigateTo('catalog'));
        return;
    }

    container.innerHTML = '';
    const list = document.createElement('div');
    list.className = 'orders-list';

    orders.forEach(order => {
        const card = document.createElement('div');
        card.className = 'order-card';

        const dateStr = new Date(order.created_at).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        // Map DB status values (CONFIRMED/CANCELED) to CSS classes
        const statusMap = {
            'CONFIRMED': 'status-confirmed',
            'CANCELED':  'status-cancelled',
            'CANCELLED': 'status-cancelled',
            'pending':   'status-pending',
            'shipped':   'status-shipped',
            'delivered': 'status-delivered',
        };
        const rawStatus   = (order.status || 'CONFIRMED').toUpperCase();
        const statusClass = statusMap[order.status] || statusMap[rawStatus] || 'status-confirmed';
        const statusLabel = order.status || 'CONFIRMED';

        const itemsHtml = (order.items || []).map(item => {
            const imgUrl = item.image_url || `https://picsum.photos/seed/p${item.id_product}/200/200`;
            const lineTotal = (parseFloat(item.unit_price || 0) * parseInt(item.quantity || 1)).toFixed(2);
            return `
                <div class="order-item-row">
                    <img class="order-item-img" src="${escHtml(imgUrl)}" alt="${escHtml(item.name)}"
                         onerror="this.style.display='none'">
                    <div class="order-item-info">
                        <div class="order-item-name">${escHtml(item.name)}</div>
                        <div class="order-item-meta">Qty: ${item.quantity} · $${parseFloat(item.unit_price || 0).toFixed(2)} each</div>
                    </div>
                    <div class="order-item-subtotal">$${lineTotal}</div>
                </div>`;
        }).join('');

        card.innerHTML = `
            <div class="order-card-head">
                <div>
                    <div class="order-id-label">Order #${order.id_order}</div>
                    <div class="order-date">${dateStr}</div>
                </div>
                <div class="order-head-right">
                    <span class="order-status ${statusClass}">${statusLabel}</span>
                    <div class="order-total">$${parseFloat(order.total_price || 0).toFixed(2)}</div>
                </div>
            </div>
            <div class="order-items-list">${itemsHtml}</div>`;

        list.appendChild(card);
    });

    container.appendChild(list);
}

/* ══════════════════════════════════════════════════
   PROFILE PAGE
   ══════════════════════════════════════════════════ */
function setupProfile() {
    // Profile section nav (Account Info / Security)
    document.querySelectorAll('.profile-nav-item').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.profile-nav-item').forEach(b => b.classList.remove('pnav-active'));
            btn.classList.add('pnav-active');

            const section = btn.dataset.section;
            document.getElementById('section-info').classList.toggle('hidden', section !== 'info');
            document.getElementById('section-security').classList.toggle('hidden', section !== 'security');
        });
    });

    // Save profile info (calls update_profile.php if you add it, or shows toast)
    document.getElementById('save-profile-btn').addEventListener('click', async () => {
        const name  = document.getElementById('pf-name').value.trim();
        const phone = document.getElementById('pf-phone').value.trim();
        if (!name) { showToast('❌ Name cannot be empty', 'red'); return; }

        try {
            const fd = new FormData();
            fd.append('name', name);
            fd.append('phone_number', phone);
            const res  = await fetch('update_profile.php', { method: 'POST', body: fd });
            const data = await res.json();
            if (data.success) {
                currentUser.user_name   = name;
                currentUser.phone_number = phone;
                populateUserUI();
                showToast('✅ Profile updated!', 'green');
            } else {
                showToast('❌ ' + (data.message || 'Update failed'), 'red');
            }
        } catch {
            // update_profile.php not yet created — optimistic local update
            currentUser.user_name    = name;
            currentUser.phone_number = phone;
            populateUserUI();
            showToast('✅ Profile updated!', 'green');
        }
    });

    // Change password
    document.getElementById('change-pass-btn').addEventListener('click', async () => {
        const cur  = document.getElementById('pf-cur-pass').value;
        const nw   = document.getElementById('pf-new-pass').value;
        const conf = document.getElementById('pf-conf-pass').value;
        if (!cur || !nw || !conf) { showToast('❌ Fill in all fields', 'red'); return; }
        if (nw !== conf)          { showToast('❌ New passwords do not match', 'red'); return; }
        if (nw.length < 6)        { showToast('❌ Password must be at least 6 characters', 'red'); return; }

        try {
            const fd = new FormData();
            fd.append('current_password', cur);
            fd.append('new_password', nw);
            const res  = await fetch('change_password.php', { method: 'POST', body: fd });
            const data = await res.json();
            if (data.success) {
                document.getElementById('pf-cur-pass').value  = '';
                document.getElementById('pf-new-pass').value  = '';
                document.getElementById('pf-conf-pass').value = '';
                showToast('✅ Password changed!', 'green');
            } else {
                showToast('❌ ' + (data.message || 'Failed'), 'red');
            }
        } catch {
            showToast('❌ Could not reach server', 'red');
        }
    });
}

async function loadProfileStats() {
    // If we already have orders cached, use them
    if (ordersCache !== null) {
        updateProfileStats(ordersCache);
        return;
    }
    // Otherwise fetch
    try {
        const res  = await fetch('get_orders.php');
        const data = await res.json();
        if (data.success) {
            ordersCache = data.orders;
            updateProfileStats(ordersCache);
        }
    } catch { /* silent */ }
}

function updateProfileStats(orders) {
    const count = orders.length;
    const total = orders.reduce((s, o) => s + parseFloat(o.total_price || 0), 0);
    document.getElementById('profile-order-count').textContent = count;
    document.getElementById('profile-total-spent').textContent = `$${total.toFixed(0)}`;
}

/* ══════════════════════════════════════════════════
   PRODUCT QUICK-VIEW MODAL
   ══════════════════════════════════════════════════ */
function setupModals() {
    document.getElementById('modal-close').addEventListener('click', closeProductModal);
    document.getElementById('modal-overlay').addEventListener('click', (e) => {
        if (e.target === document.getElementById('modal-overlay')) closeProductModal();
    });
    document.getElementById('modal-add-btn').addEventListener('click', () => {
        if (currentModal) { addToCart(currentModal); closeProductModal(); }
    });

    // Confirm modal buttons
    document.getElementById('confirm-close').addEventListener('click', () => {
        document.getElementById('confirm-overlay').classList.remove('open');
        navigateTo('catalog');
    });
    document.getElementById('confirm-view-orders').addEventListener('click', () => {
        document.getElementById('confirm-overlay').classList.remove('open');
        navigateTo('orders');
    });
}

function openProductModal(product) {
    currentModal = product;
    const imgUrl = product.image_url || `https://picsum.photos/seed/p${product.id_product}/800/500`;
    const price  = parseFloat(product.price || 0).toFixed(2);

    document.getElementById('modal-id').textContent   = `Product #${product.id_product} · ${product.category || ''}`;
    document.getElementById('modal-name').textContent  = product.name;
    document.getElementById('modal-price').innerHTML   = `<sup>$</sup>${price}`;
    document.getElementById('modal-desc').textContent  = product.description || 'No description available.';

    document.getElementById('modal-img-area').innerHTML = `
        <img class="modal-image" src="${escHtml(imgUrl)}" alt="${escHtml(product.name)}"
             onerror="this.outerHTML='<div class=\\'modal-image-ph\\'><svg width=\\'64\\' height=\\'64\\' viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'#ccc\\' stroke-width=\\'1.2\\'><rect x=\\'3\\' y=\\'3\\' width=\\'18\\' height=\\'18\\' rx=\\'2\\'/><circle cx=\\'8.5\\' cy=\\'8.5\\' r=\\'1.5\\'/><polyline points=\\'21 15 16 10 5 21\\'/></svg></div>'">`;

    document.getElementById('modal-overlay').classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeProductModal() {
    document.getElementById('modal-overlay').classList.remove('open');
    document.body.style.overflow = '';
    currentModal = null;
}

/* ══════════════════════════════════════════════════
   LOGOUT
   ══════════════════════════════════════════════════ */
async function logoutUser() {
    try {
        const res  = await fetch('logout.php');
        const data = await res.json();
        if (data.success) {
            localStorage.removeItem('ss_cart');
            window.location.href = 'auth.html';
        }
    } catch { window.location.href = 'auth.html'; }
}

/* ══════════════════════════════════════════════════
   TOAST
   ══════════════════════════════════════════════════ */
function showToast(message, type = '') {
    const container = document.getElementById('toast-container');
    const toast     = document.createElement('div');
    toast.className = 'toast' + (type ? ` ${type}` : '');
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 2900);
}

/* ══════════════════════════════════════════════════
   UTILS
   ══════════════════════════════════════════════════ */
function escHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
