let allProducts = [];
let filteredProducts = [];
let cart = [];
let favorites = []; // New favorites array
let categories = [];

const productsContainer = document.getElementById('productsContainer');
const loading = document.getElementById('loading');
const noResults = document.getElementById('noResults');
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const sortSelect = document.getElementById('sortSelect');
const cartToggle = document.getElementById('cartToggle');
const cartSidebar = document.getElementById('cartSidebar');
const cartOverlay = document.getElementById('cartOverlay');
const closeCart = document.getElementById('closeCart');
const cartItems = document.getElementById('cartItems');
const cartCount = document.getElementById('cartCount');
const cartTotal = document.getElementById('cartTotal');
const totalPrice = document.getElementById('totalPrice');
const checkoutBtn = document.getElementById('checkoutBtn');
const checkoutModal = document.getElementById('checkoutModal');
const successModal = document.getElementById('successModal');
const confirmPurchase = document.getElementById('confirmPurchase');
const modalOrderSummary = document.getElementById('modalOrderSummary');
const modalTotalPrice = document.getElementById('modalTotalPrice');

// New favorites elements
const favoritesToggle = document.getElementById('favoritesToggle');
const favoritesSidebar = document.getElementById('favoritesSidebar');
const closeFavorites = document.getElementById('closeFavorites');
const favoritesItems = document.getElementById('favoritesItems');
const favoritesCount = document.getElementById('favoritesCount');
const showFavoritesOnly = document.getElementById('showFavoritesOnly');

document.addEventListener('DOMContentLoaded', function () {
    loadCartFromStorage();
    loadFavoritesFromStorage(); // Load favorites on page load
    fetchProducts();
    setupEventListeners();
    setupModalEventListeners();
});

// Modal functions - Native implementation
function showModal(modalElement) {
    modalElement.style.display = 'block';
    modalElement.classList.add('show');
    modalElement.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    document.body.style.overflow = 'hidden';
    
    // Add backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop fade show';
    backdrop.setAttribute('data-modal-id', modalElement.id);
    document.body.appendChild(backdrop);
    
    // Animation
    setTimeout(() => {
        modalElement.classList.add('fade-in');
    }, 10);
}

function hideModal(modalElement) {
    modalElement.classList.remove('fade-in');
    modalElement.classList.remove('show');
    modalElement.setAttribute('aria-hidden', 'true');
    
    // Remove backdrop
    const backdrop = document.querySelector(`[data-modal-id="${modalElement.id}"]`);
    if (backdrop) {
        backdrop.remove();
    }
    
    setTimeout(() => {
        modalElement.style.display = 'none';
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
    }, 300);
}

function setupModalEventListeners() {
    // Close modal when clicking close buttons
    const closeButtons = document.querySelectorAll('[data-bs-dismiss="modal"]');
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                hideModal(modal);
            }
        });
    });
    
    // Close modal when clicking backdrop
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal-backdrop')) {
            const modalId = e.target.getAttribute('data-modal-id');
            const modal = document.getElementById(modalId);
            if (modal) {
                hideModal(modal);
            }
        }
    });
    
    // Close modal with ESC key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const openModal = document.querySelector('.modal.show');
            if (openModal) {
                hideModal(openModal);
            }
        }
    });
}

function setupEventListeners() {
    searchInput.addEventListener('input', debounce(filterAndRenderProducts, 300));
    categoryFilter.addEventListener('change', filterAndRenderProducts);
    sortSelect.addEventListener('change', filterAndRenderProducts);
    cartToggle.addEventListener('click', toggleCart);
    closeCart.addEventListener('click', toggleCart);
    cartOverlay.addEventListener('click', toggleCart);
    checkoutBtn.addEventListener('click', showCheckoutModal);
    confirmPurchase.addEventListener('click', processPurchase);
    
    // New favorites event listeners
    if (favoritesToggle) {
        favoritesToggle.addEventListener('click', toggleFavorites);
    }
    if (closeFavorites) {
        closeFavorites.addEventListener('click', toggleFavorites);
    }
    if (showFavoritesOnly) {
        showFavoritesOnly.addEventListener('change', filterAndRenderProducts);
    }
}

async function fetchProducts() {
    try {
        showLoading(true);
        const response = await fetch('https://fakestoreapi.com/products');

        if (!response.ok) {
            throw new Error('Error al cargar los productos');
        }

        allProducts = await response.json();
        filteredProducts = [...allProducts];

        extractCategories();
        populateCategoryFilter();
        renderProducts();
        showLoading(false);

    } catch (error) {
        console.error('Error fetching products:', error);
        showError('Error al cargar los productos. Por favor, intenta de nuevo.');
        showLoading(false);
    }
}

function extractCategories() {
    categories = [...new Set(allProducts.map(product => product.category))];
}

function populateCategoryFilter() {
    categoryFilter.innerHTML = '<option value="">Todas las categorías</option>';
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = capitalizeFirstLetter(category);
        categoryFilter.appendChild(option);
    });
}

function filterAndRenderProducts() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const selectedCategory = categoryFilter.value;
    const sortOption = sortSelect.value;
    const showOnlyFavorites = showFavoritesOnly ? showFavoritesOnly.checked : false;

    filteredProducts = allProducts.filter(product => {
        const matchesSearch = searchTerm === '' ||
            product.title.toLowerCase().includes(searchTerm) ||
            product.description.toLowerCase().includes(searchTerm);

        const matchesCategory = selectedCategory === '' || product.category === selectedCategory;
        
        const matchesFavorites = !showOnlyFavorites || isProductInFavorites(product.id);

        return matchesSearch && matchesCategory && matchesFavorites;
    });

    if (sortOption) {
        sortProducts(sortOption);
    }

    renderProducts();
}

function sortProducts(option) {
    switch (option) {
        case 'price-asc':
            filteredProducts.sort((a, b) => a.price - b.price);
            break;
        case 'price-desc':
            filteredProducts.sort((a, b) => b.price - a.price);
            break;
        case 'name-asc':
            filteredProducts.sort((a, b) => a.title.localeCompare(b.title));
            break;
        case 'name-desc':
            filteredProducts.sort((a, b) => b.title.localeCompare(a.title));
            break;
    }
}

function renderProducts() {
    if (filteredProducts.length === 0) {
        productsContainer.style.display = 'none';
        noResults.style.display = 'block';
        return;
    }

    noResults.style.display = 'none';
    productsContainer.style.display = 'flex';
    productsContainer.innerHTML = '';

    filteredProducts.forEach(product => {
        const productCard = createProductCard(product);
        productsContainer.appendChild(productCard);
    });
}

function createProductCard(product) {
    const col = document.createElement('div');
    col.className = 'col-lg-3 col-md-4 col-sm-6 mb-4';
    
    const isFavorite = isProductInFavorites(product.id);
    const favoriteClass = isFavorite ? 'active' : '';
    const favoriteIcon = isFavorite ? 'bi-heart-fill' : 'bi-heart';

    col.innerHTML = `
        <div class="card product-card fade-in">
            <div class="position-relative">
                <img src="${product.image}" alt="${product.title}" class="product-image">
                <button class="favorite-btn ${favoriteClass}" onclick="toggleFavorite(${product.id})" 
                        title="${isFavorite ? 'Eliminar de favoritos' : 'Agregar a favoritos'}">
                    <i class="bi ${favoriteIcon}"></i>
                </button>
            </div>
            <div class="card-body d-flex flex-column">
                <h5 class="product-title">${product.title}</h5>
                <div class="product-category">${capitalizeFirstLetter(product.category)}</div>
                <div class="product-price">$${product.price.toFixed(2)}</div>
                <div class="mt-auto">
                    <button class="btn btn-add-cart" onclick="addToCart(${product.id})">
                        <i class="bi bi-cart-plus"></i> Agregar al Carrito
                    </button>
                </div>
            </div>
        </div>
    `;

    return col;
}

// ====== FAVORITES FUNCTIONALITY ======

function toggleFavorite(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;

    const favoriteIndex = favorites.findIndex(fav => fav.id === productId);
    
    if (favoriteIndex === -1) {
        // Add to favorites
        favorites.push({
            id: product.id,
            title: product.title,
            price: product.price,
            image: product.image,
            category: product.category,
            dateAdded: new Date().toISOString()
        });
        showFavoriteAnimation(productId, true);
    } else {
        // Remove from favorites
        favorites.splice(favoriteIndex, 1);
        showFavoriteAnimation(productId, false);
    }
    
    updateFavoritesUI();
    saveFavoritesToStorage();
    
    // Re-render products to update favorite buttons
    renderProducts();
}

function isProductInFavorites(productId) {
    return favorites.some(fav => fav.id === productId);
}

function updateFavoritesUI() {
    updateFavoritesCount();
    renderFavoritesItems();
}

function updateFavoritesCount() {
    if (favoritesCount) {
        favoritesCount.textContent = favorites.length;
        
        if (favorites.length > 0) {
            favoritesCount.style.display = 'flex';
            favoritesCount.classList.add('bounce');
            setTimeout(() => favoritesCount.classList.remove('bounce'), 500);
        } else {
            favoritesCount.style.display = 'none';
        }
    }
}

function renderFavoritesItems() {
    if (!favoritesItems) return;
    
    if (favorites.length === 0) {
        favoritesItems.innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-heart" style="font-size: 3rem; color: var(--dark-gray);"></i>
                <h5 class="mt-3 text-muted">No tienes favoritos</h5>
                <p class="text-muted">¡Marca algunos productos como favoritos!</p>
            </div>
        `;
        return;
    }

    favoritesItems.innerHTML = '';

    favorites.forEach(item => {
        const favoriteItem = document.createElement('div');
        favoriteItem.className = 'favorite-item mb-3';
        favoriteItem.innerHTML = `
            <div class="row align-items-center">
                <div class="col-3">
                    <img src="${item.image}" alt="${item.title}" class="img-fluid rounded">
                </div>
                <div class="col-6">
                    <h6 class="mb-1">${item.title.substring(0, 40)}...</h6>
                    <div class="fw-bold text-primary">$${item.price.toFixed(2)}</div>
                    <small class="text-muted">${capitalizeFirstLetter(item.category)}</small>
                </div>
                <div class="col-3 text-end">
                    <button class="btn btn-sm btn-outline-primary mb-1" onclick="addToCart(${item.id})" 
                            title="Agregar al carrito">
                        <i class="bi bi-cart-plus"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="toggleFavorite(${item.id})" 
                            title="Eliminar de favoritos">
                        <i class="bi bi-heart-fill"></i>
                    </button>
                </div>
            </div>
        `;
        favoritesItems.appendChild(favoriteItem);
    });
}

function toggleFavorites() {
    if (!favoritesSidebar) return;
    
    const isActive = favoritesSidebar.classList.contains('active');

    if (isActive) {
        favoritesSidebar.classList.remove('active');
        cartOverlay.classList.remove('active');
        document.body.style.overflow = '';
    } else {
        // Close cart if open
        cartSidebar.classList.remove('active');
        
        favoritesSidebar.classList.add('active');
        cartOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Update favorites display
        renderFavoritesItems();
    }
}

function showFavoriteAnimation(productId, isAdded) {
    // Find the favorite button for this product
    const productCards = document.querySelectorAll('.product-card');
    productCards.forEach(card => {
        const button = card.querySelector('.favorite-btn');
        const cartButton = card.querySelector('.btn-add-cart');
        
        // Check if this is the right product by looking at the onclick attribute
        if (cartButton && cartButton.getAttribute('onclick').includes(`addToCart(${productId})`)) {
            const icon = button.querySelector('i');
            
            if (isAdded) {
                button.classList.add('active');
                icon.className = 'bi bi-heart-fill';
                button.classList.add('pulse-heart');
                
                // Show floating heart animation
                showFloatingHeart(button);
            } else {
                button.classList.remove('active');
                icon.className = 'bi bi-heart';
            }
            
            setTimeout(() => {
                button.classList.remove('pulse-heart');
            }, 600);
        }
    });
    
    // Update favorites count with animation
    if (favoritesCount) {
        favoritesCount.classList.add('pulse');
        setTimeout(() => favoritesCount.classList.remove('pulse'), 1000);
    }
}

function showFloatingHeart(button) {
    const heart = document.createElement('div');
    heart.innerHTML = '<i class="bi bi-heart-fill"></i>';
    heart.className = 'floating-heart';
    
    const rect = button.getBoundingClientRect();
    heart.style.position = 'fixed';
    heart.style.left = rect.left + rect.width / 2 + 'px';
    heart.style.top = rect.top + 'px';
    heart.style.color = '#e91e63';
    heart.style.fontSize = '1.5rem';
    heart.style.pointerEvents = 'none';
    heart.style.zIndex = '9999';
    heart.style.animation = 'floatUp 1.5s ease-out forwards';
    
    document.body.appendChild(heart);
    
    setTimeout(() => {
        heart.remove();
    }, 1500);
}

function saveFavoritesToStorage() {
    try {
        // Using window property instead of localStorage for Claude.ai compatibility
        window.savedFavorites = favorites;
    } catch (error) {
        console.error('Error saving favorites:', error);
    }
}

function loadFavoritesFromStorage() {
    try {
        if (window.savedFavorites) {
            favorites = window.savedFavorites;
            updateFavoritesUI();
        }
    } catch (error) {
        console.error('Error loading favorites:', error);
        favorites = [];
    }
}

function clearAllFavorites() {
    if (confirm('¿Estás seguro de que quieres eliminar todos los favoritos?')) {
        favorites = [];
        updateFavoritesUI();
        saveFavoritesToStorage();
        renderProducts(); // Re-render to update favorite buttons
    }
}

// ====== END FAVORITES FUNCTIONALITY ======

function addToCart(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;

    const existingItem = cart.find(item => item.id === productId);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            ...product,
            quantity: 1
        });
    }

    updateCartUI();
    saveCartToStorage();
    showCartAnimation();
}

function showCheckoutModal() {
    if (cart.length === 0) {
        alert('Tu carrito está vacío. Agrega algunos productos antes de proceder al pago.');
        return;
    }

    populateOrderSummary();
    showModal(checkoutModal);
}

function populateOrderSummary() {
    modalOrderSummary.innerHTML = '';

    cart.forEach(item => {
        const summaryItem = document.createElement('div');
        summaryItem.className = 'd-flex justify-content-between align-items-center mb-2';
        summaryItem.innerHTML = `
            <div class="d-flex align-items-center">
                <img src="${item.image}" alt="${item.title}" 
                     style="width: 40px; height: 40px; object-fit: cover; border-radius: 8px; margin-right: 10px;">
                <div>
                    <div class="fw-medium" style="font-size: 0.9rem;">${item.title.substring(0, 30)}...</div>
                    <small class="text-muted">Cantidad: ${item.quantity}</small>
                </div>
            </div>
            <div class="fw-bold" style="color: var(--primary-red);">
                $${(item.price * item.quantity).toFixed(2)}
            </div>
        `;
        modalOrderSummary.appendChild(summaryItem);
    });

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    modalTotalPrice.textContent = `$${total.toFixed(2)}`;
}

function processPurchase() {
    // Hide checkout modal
    hideModal(checkoutModal);
    
    // Clear cart
    cart = [];
    updateCartUI();
    saveCartToStorage();

    // Close cart sidebar
    cartSidebar.classList.remove('active');
    cartOverlay.classList.remove('active');

    // Show success modal after a brief delay
    setTimeout(() => {
        showModal(successModal);
    }, 400);
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCartUI();
    saveCartToStorage();
}

function updateCartUI() {
    updateCartCount();
    renderCartItems();
    updateCartTotal();
}

function updateCartCount() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;

    if (totalItems > 0) {
        cartCount.style.display = 'flex';
        cartCount.classList.add('bounce');
        setTimeout(() => cartCount.classList.remove('bounce'), 500);
    } else {
        cartCount.style.display = 'none';
    }
}

function renderCartItems() {
    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-cart-x" style="font-size: 3rem; color: var(--dark-gray);"></i>
                <h5 class="mt-3 text-muted">Tu carrito está vacío</h5>
                <p class="text-muted">¡Agrega algunos productos para empezar!</p>
            </div>
        `;
        cartTotal.style.display = 'none';
        return;
    }

    cartTotal.style.display = 'block';
    cartItems.innerHTML = '';

    cart.forEach(item => {
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <div class="row align-items-center">
                <div class="col-3">
                    <img src="${item.image}" alt="${item.title}" class="img-fluid">
                </div>
                <div class="col-6">
                    <h6 class="mb-1">${item.title.substring(0, 50)}...</h6>
                    <small class="text-muted">$${item.price.toFixed(2)} c/u</small>
                    <div class="d-flex align-items-center mt-2">
                        <button class="btn btn-sm btn-outline-secondary" onclick="updateQuantity(${item.id}, -1)">
                            <i class="bi bi-dash"></i>
                        </button>
                        <span class="mx-2 fw-bold">${item.quantity}</span>
                        <button class="btn btn-sm btn-outline-secondary" onclick="updateQuantity(${item.id}, 1)">
                            <i class="bi bi-plus"></i>
                        </button>
                    </div>
                </div>
                <div class="col-3 text-end">
                    <div class="fw-bold text-primary">$${(item.price * item.quantity).toFixed(2)}</div>
                    <button class="btn btn-sm btn-outline-danger mt-1" onclick="removeFromCart(${item.id})">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
        `;
        cartItems.appendChild(cartItem);
    });
}

function updateQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);
    if (!item) return;

    item.quantity += change;

    if (item.quantity <= 0) {
        removeFromCart(productId);
    } else {
        updateCartUI();
        saveCartToStorage();
    }
}

function updateCartTotal() {
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    totalPrice.textContent = `$${total.toFixed(2)}`;
}

function toggleCart() {
    const isActive = cartSidebar.classList.contains('active');

    if (isActive) {
        cartSidebar.classList.remove('active');
        cartOverlay.classList.remove('active');
        document.body.style.overflow = '';
    } else {
        // Close favorites if open
        if (favoritesSidebar) favoritesSidebar.classList.remove('active');
        
        cartSidebar.classList.add('active');
        cartOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function saveCartToStorage() {
    try {
        window.savedCart = cart;
    } catch (error) {
        console.error('Error saving cart:', error);
    }
}

function loadCartFromStorage() {
    try {
        if (window.savedCart) {
            cart = window.savedCart;
            updateCartUI();
        }
    } catch (error) {
        console.error('Error loading cart:', error);
        cart = [];
    }
}

function showLoading(show) {
    loading.style.display = show ? 'flex' : 'none';
    productsContainer.style.display = show ? 'none' : 'flex';
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'alert alert-danger text-center';
    errorDiv.innerHTML = `
        <i class="bi bi-exclamation-triangle"></i>
        <strong>Error:</strong> ${message}
    `;
    document.querySelector('.container').insertBefore(errorDiv, productsContainer);

    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function showCartAnimation() {
    cartCount.classList.add('pulse');
    setTimeout(() => cartCount.classList.remove('pulse'), 1000);
}

// Responsive handling
window.addEventListener('resize', function () {
    if (window.innerWidth > 768) {
        if (cartSidebar.classList.contains('active')) {
            cartSidebar.style.width = '400px';
        }
        if (favoritesSidebar && favoritesSidebar.classList.contains('active')) {
            favoritesSidebar.style.width = '400px';
        }
    } else if (window.innerWidth <= 768) {
        cartSidebar.style.width = '100%';
        if (favoritesSidebar) favoritesSidebar.style.width = '100%';
    }
});

function cleanupModalsAndScroll() {
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    
    const backdrops = document.querySelectorAll('.modal-backdrop');
    backdrops.forEach(backdrop => {
        backdrop.remove();
    });

    cartSidebar.classList.remove('active');
    if (favoritesSidebar) favoritesSidebar.classList.remove('active');
    cartOverlay.classList.remove('active');
}

document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') {
        setTimeout(cleanupModalsAndScroll, 100);
    }
});