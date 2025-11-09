/* === Customer Home Page === */

let currentUser = null;
let cartItems = [];
let restaurants = [];
let currentFilters = {};
let currentSort = 'rating';

document.addEventListener('DOMContentLoaded', () => {
    initializeCustomerHome();
    checkUserAuthentication();
    loadRestaurants();
    setupSearchFunctionality();
    startFoodCarousel();
});

// Initialize customer home page
function initializeCustomerHome() {
    // Hide loading screen
    setTimeout(() => {
        const loadingScreen = document.getElementById('customer-loading');
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            setTimeout(() => loadingScreen.style.display = 'none', 500);
        }
    }, 1500);

    // Setup event listeners
    setupEventListeners();
    
    // Load cart from storage
    loadCartFromStorage();
    
    // Show welcome message
    showCustomerToast('success', 'Welcome to StarkBites!', 'Discover amazing food from top restaurants');
}

// Setup event listeners
function setupEventListeners() {
    // Close dropdowns when clicking outside
    document.addEventListener('click', (event) => {
        if (!event.target.closest('.user-menu')) {
            closeUserMenu();
        }
    });

    // Close modals when clicking outside
    document.addEventListener('click', (event) => {
        if (event.target.classList.contains('modal-overlay')) {
            closeAllModals();
        }
    });

    // Handle escape key
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeAllModals();
            closeCart();
        }
    });
}

// Check user authentication
function checkUserAuthentication() {
    const loggedInUser = sessionStorage.getItem('loggedInUser');
    const userNameEl = document.getElementById('user-name');
    const userStatusEl = document.querySelector('.user-status');
    const userDropdown = document.getElementById('user-dropdown');
    
    if (loggedInUser) {
        currentUser = JSON.parse(loggedInUser);
        
        // Update UI for logged in user
        userNameEl.textContent = currentUser.fullName || currentUser.username;
        userStatusEl.textContent = 'Logged in';
        
        // Populate user dropdown
        userDropdown.innerHTML = `
            <a href="customer_profile.html" class="dropdown-item">
                <i class="fas fa-user"></i> My Profile
            </a>
            <a href="my_orders.html" class="dropdown-item">
                <i class="fas fa-receipt"></i> My Orders
            </a>
            <a href="#" class="dropdown-item">
                <i class="fas fa-heart"></i> Favorites
            </a>
            <a href="#" class="dropdown-item">
                <i class="fas fa-wallet"></i> Wallet
            </a>
            <div class="dropdown-divider"></div>
            <a href="#" class="dropdown-item logout-item" onclick="handleUserLogout()">
                <i class="fas fa-sign-out-alt"></i> Logout
            </a>
        `;
        
        loadRecentOrders();
    } else {
        // Update UI for guest user
        userNameEl.textContent = 'Guest';
        userStatusEl.textContent = 'Not logged in';
        
        // Populate guest dropdown
        userDropdown.innerHTML = `
            <a href="login.html" class="dropdown-item">
                <i class="fas fa-sign-in-alt"></i> Login
            </a>
            <a href="register.html" class="dropdown-item">
                <i class="fas fa-user-plus"></i> Sign Up
            </a>
        `;
    }
}

// Load restaurants from database
async function loadRestaurants() {
    try {
        const response = await fetch('/api/restaurants');
        
        if (!response.ok) {
            throw new Error('Failed to fetch restaurants');
        }
        
        const data = await response.json();
        
        // Transform database data to match our format
        restaurants = data.map(restaurant => ({
            id: restaurant.id,
            name: restaurant.name,
            cuisine: restaurant.cuisine || restaurant.category || 'restaurant',
            rating: restaurant.rating || 4.5,
            deliveryTime: restaurant.deliveryTime || '30-40',
            minOrder: restaurant.minimumOrder || restaurant.minOrder || 10,
            deliveryFee: restaurant.deliveryFee || 2.99,
            image: restaurant.imageUrl || getCuisineEmoji(restaurant.cuisine || restaurant.category),
            featured: restaurant.featured || false,
            popular: restaurant.popular || restaurant.rating >= 4.5,
            address: restaurant.address || '',
            phone: restaurant.phone || '',
            description: restaurant.description || ''
        }));

        displayRestaurants(restaurants);
        
        if (restaurants.length === 0) {
            showEmptyState();
        }
    } catch (error) {
        console.error('Error loading restaurants:', error);
        showCustomerToast('error', 'Loading Error', 'Failed to load restaurants from database');
        
        // Show empty state with error message
        const restaurantsGrid = document.getElementById('restaurants-grid');
        restaurantsGrid.innerHTML = `
            <div class="error-state" style="grid-column: 1/-1; text-align: center; padding: 3rem;">
                <i class="fas fa-exclamation-triangle" style="font-size: 4rem; color: #e74c3c; margin-bottom: 1rem;"></i>
                <h3 style="color: #333; margin-bottom: 1rem;">Unable to Load Restaurants</h3>
                <p style="color: #666; margin-bottom: 1.5rem;">There was an error connecting to the database.</p>
                <button onclick="loadRestaurants()" class="btn-primary">
                    <i class="fas fa-sync-alt"></i> Try Again
                </button>
            </div>
        `;
    }
}

// Get emoji based on cuisine type
function getCuisineEmoji(cuisine) {
    const cuisineEmojis = {
        pizza: '🍕',
        burger: '🍔',
        asian: '🍜',
        chinese: '🥡',
        japanese: '🍣',
        mexican: '🌮',
        italian: '🍝',
        indian: '🍛',
        healthy: '🥗',
        coffee: '☕',
        dessert: '🍰',
        seafood: '🦞',
        bbq: '🍖',
        vegan: '🥬'
    };
    
    return cuisineEmojis[cuisine?.toLowerCase()] || '🍽️';
}

// Display restaurants
function displayRestaurants(restaurantList) {
    const restaurantsGrid = document.getElementById('restaurants-grid');
    
    if (!restaurantList || restaurantList.length === 0) {
        showEmptyState();
        return;
    }
    
    const restaurantsHTML = restaurantList.map(restaurant => {
        // Check if image is a URL or emoji
        const isImageUrl = restaurant.image && (restaurant.image.startsWith('http') || restaurant.image.startsWith('/'));
        
        return `
        <div class="restaurant-card ${restaurant.featured ? 'featured' : ''}" onclick="openRestaurant(${restaurant.id})">
            <div class="restaurant-image" style="position: relative; height: 220px; overflow: hidden; border-radius: 20px 20px 0 0;">
                ${isImageUrl ? 
                    `<img src="${restaurant.image}" alt="${restaurant.name}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                     <div style="display: none; width: 100%; height: 100%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); align-items: center; justify-content: center; font-size: 5rem;">
                        ${getCuisineEmoji(restaurant.cuisine)}
                     </div>` 
                    : 
                    `<div style="width: 100%; height: 100%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; font-size: 5rem;">
                        ${restaurant.image}
                     </div>`
                }
                
                <div style="position: absolute; top: 1rem; left: 1rem; right: 1rem; display: flex; justify-content: space-between; z-index: 2;">
                    ${restaurant.featured ? '<span class="badge featured" style="background: var(--primary-green); color: white; padding: 0.4rem 0.8rem; border-radius: 20px; font-size: 0.75rem; font-weight: 600;">Featured</span>' : ''}
                    ${restaurant.popular ? '<span class="badge discount" style="background: #ffc107; color: white; padding: 0.4rem 0.8rem; border-radius: 20px; font-size: 0.75rem; font-weight: 600; margin-left: auto;">Popular</span>' : ''}
                </div>
                
                <div class="restaurant-overlay" style="position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(to top, rgba(0,0,0,0.7), transparent); padding: 2rem 1rem 1rem; opacity: 0; transition: opacity 0.3s;">
                    <button class="view-menu-btn" style="background: var(--primary-green); color: white; border: none; padding: 0.6rem 1.25rem; border-radius: 10px; font-weight: 600; cursor: pointer;">View Menu</button>
                </div>
            </div>
            
            <div class="restaurant-content" style="padding: 1.5rem;">
                <div class="restaurant-header" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
                    <h3 class="restaurant-name" style="font-size: 1.35rem; color: #333; font-weight: 700; margin: 0;">${restaurant.name}</h3>
                    <div class="restaurant-rating" style="display: flex; align-items: center; gap: 0.25rem; background: var(--primary-green); color: white; padding: 0.4rem 0.75rem; border-radius: 10px; font-weight: 600;">
                        <i class="fas fa-star"></i>
                        <span>${restaurant.rating.toFixed(1)}</span>
                    </div>
                </div>
                
                <div class="restaurant-meta" style="display: flex; align-items: center; gap: 1.5rem; color: #666; font-size: 0.9rem; margin-bottom: 0.75rem;">
                    <span class="meta-item" style="display: flex; align-items: center; gap: 0.4rem;">
                        <i class="fas fa-clock"></i> ${restaurant.deliveryTime} min
                    </span>
                    <span class="meta-item" style="display: flex; align-items: center; gap: 0.4rem;">
                        <i class="fas fa-dollar-sign"></i> Min $${restaurant.minOrder}
                    </span>
                </div>
                
                <div class="restaurant-cuisines" style="color: #999; font-size: 0.9rem; margin-bottom: 1rem; text-transform: capitalize;">
                    ${restaurant.cuisine}
                    ${restaurant.description ? `<span style="display: block; margin-top: 0.5rem; color: #666; font-size: 0.85rem; line-height: 1.4;">${restaurant.description.substring(0, 80)}${restaurant.description.length > 80 ? '...' : ''}</span>` : ''}
                </div>
                
                <div class="restaurant-footer" style="display: flex; justify-content: space-between; align-items: center; padding-top: 1rem; border-top: 1px solid #f8f9fa;">
                    <span class="delivery-fee" style="font-weight: 600; color: #333;">
                        ${restaurant.deliveryFee === 0 ? '🎉 Free delivery' : `$${restaurant.deliveryFee.toFixed(2)} delivery`}
                    </span>
                </div>
            </div>
        </div>
    `}).join('');
    
    restaurantsGrid.innerHTML = restaurantsHTML;
    
    // Update results count
    updateResultsCount(restaurantList.length);
}

// Show empty state
function showEmptyState() {
    const restaurantsGrid = document.getElementById('restaurants-grid');
    restaurantsGrid.innerHTML = `
        <div class="empty-state" style="grid-column: 1/-1; text-align: center; padding: 4rem 2rem; color: #666;">
            <i class="fas fa-store-slash" style="font-size: 5rem; color: #ddd; margin-bottom: 1.5rem;"></i>
            <h3 style="font-size: 1.5rem; color: #333; margin-bottom: 0.75rem;">No Restaurants Found</h3>
            <p style="margin-bottom: 1.5rem;">We couldn't find any restaurants matching your criteria.</p>
            <button onclick="clearAllFilters()" class="clear-filters-btn" style="background: var(--primary-green); color: white; border: none; padding: 0.75rem 2rem; border-radius: 12px; font-family: 'Poppins', sans-serif; font-weight: 600; cursor: pointer;">
                <i class="fas fa-sync-alt"></i> Clear Filters
            </button>
        </div>
    `;
}

// Update results count
function updateResultsCount(count) {
    const resultsCountEl = document.getElementById('results-count');
    if (resultsCountEl) {
        resultsCountEl.innerHTML = `Showing <strong>${count}</strong> restaurant${count !== 1 ? 's' : ''}`;
    }
}

// Filter by cuisine
function filterByCuisine(cuisine) {
    const filtered = restaurants.filter(restaurant => 
        restaurant.cuisine.toLowerCase() === cuisine.toLowerCase()
    );
    
    displayRestaurants(filtered);
    showCustomerToast('info', 'Filtered Results', `Showing ${cuisine} restaurants`);
    
    // Scroll to restaurants section
    document.querySelector('.featured-section').scrollIntoView({ 
        behavior: 'smooth' 
    });
}

// Sort restaurants
function sortRestaurants(sortBy) {
    let sorted = [...restaurants];
    
    switch (sortBy) {
        case 'rating':
            sorted.sort((a, b) => b.rating - a.rating);
            break;
        case 'delivery-time':
            sorted.sort((a, b) => parseInt(a.deliveryTime) - parseInt(b.deliveryTime));
            break;
        case 'price-low':
            sorted.sort((a, b) => a.minOrder - b.minOrder);
            break;
        case 'price-high':
            sorted.sort((a, b) => b.minOrder - a.minOrder);
            break;
        case 'popularity':
            sorted.sort((a, b) => b.popular - a.popular);
            break;
    }
    
    currentSort = sortBy;
    displayRestaurants(sorted);
}

// Clear all filters and show all restaurants
function clearAllFilters() {
    currentFilters = {};
    currentSort = 'rating';
    displayRestaurants(restaurants);
    showCustomerToast('success', 'Filters Cleared', 'Showing all restaurants');
}

// Open restaurant menu
function openRestaurant(restaurantId) {
    const restaurant = restaurants.find(r => r.id === restaurantId);
    if (restaurant) {
        showCustomerToast('info', 'Opening Menu', `Loading ${restaurant.name} menu...`);
        // Navigate to restaurant menu page
        window.location.href = `menu.html?restaurant=${restaurantId}`;
    }
}

// Load more restaurants
function loadMoreRestaurants() {
    showCustomerToast('info', 'Loading', 'Loading more restaurants...');
    
    // Simulate loading more restaurants
    setTimeout(() => {
        showCustomerToast('success', 'Loaded', 'More restaurants added!');
    }, 1000);
}

// Start food carousel animation
function startFoodCarousel() {
    const foodItems = document.querySelectorAll('.food-item');
    let currentIndex = 0;
    
    setInterval(() => {
        foodItems[currentIndex].classList.remove('active');
        currentIndex = (currentIndex + 1) % foodItems.length;
        foodItems[currentIndex].classList.add('active');
    }, 3000);
}

// Setup search functionality
function setupSearchFunctionality() {
    const searchInputs = document.querySelectorAll('.search-input, .hero-search-input');
    const searchButtons = document.querySelectorAll('.search-btn, .hero-search-btn');
    
    searchInputs.forEach(input => {
        input.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                performSearch();
            }
        });
    });
    
    searchButtons.forEach(button => {
        button.addEventListener('click', performSearch);
    });
}

// Perform search
function performSearch() {
    const searchTerm = document.getElementById('main-search').value.trim() || 
                      document.querySelector('.hero-search-input').value.trim();
    
    if (!searchTerm) return;
    
    const filtered = restaurants.filter(restaurant => 
        restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        restaurant.cuisine.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    displayRestaurants(filtered);
    showCustomerToast('success', 'Search Results', `Found ${filtered.length} restaurants for "${searchTerm}"`);
    
    // Scroll to results
    document.querySelector('.featured-section').scrollIntoView({ 
        behavior: 'smooth' 
    });
}

// Load recent orders for logged-in users
function loadRecentOrders() {
    const quickOrderSlider = document.getElementById('quick-order-slider');
    
    // Sample recent orders
    const recentOrders = [
        { name: "Margherita Pizza", restaurant: "Pizza Palace", price: 16.99, image: "🍕" },
        { name: "Cheeseburger Combo", restaurant: "Burger Kingdom", price: 12.99, image: "🍔" },
        { name: "California Roll", restaurant: "Sushi Express", price: 8.99, image: "🍣" }
    ];
    
    const ordersHTML = recentOrders.map(order => `
        <div class="quick-order-item" onclick="reorderItem('${order.name}')">
            <div class="order-image">${order.image}</div>
            <div class="order-info">
                <h4>${order.name}</h4>
                <p>${order.restaurant}</p>
                <span class="order-price">$${order.price}</span>
            </div>
            <button class="reorder-btn">
                <i class="fas fa-plus"></i>
            </button>
        </div>
    `).join('');
    
    quickOrderSlider.innerHTML = ordersHTML;
}

// Reorder item
function reorderItem(itemName) {
    showCustomerToast('success', 'Added to Cart', `${itemName} added to your cart`);
    // Add to cart logic would go here
}

// Location functions
function openLocationSelector() {
    const modal = document.getElementById('location-modal');
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('show'), 10);
}

function closeLocationSelector() {
    const modal = document.getElementById('location-modal');
    modal.classList.remove('show');
    setTimeout(() => modal.style.display = 'none', 300);
}

function selectLocation(location) {
    const locationText = document.getElementById('current-location');
    locationText.textContent = location;
    closeLocationSelector();
    showCustomerToast('success', 'Location Updated', `Delivery location set to ${location}`);
}

function useCurrentLocation() {
    showCustomerToast('info', 'Getting Location', 'Getting your current location...');
    
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                selectLocation('Current Location');
            },
            (error) => {
                showCustomerToast('error', 'Location Error', 'Could not get your location');
            }
        );
    }
}

// Filters functions
function openFilters() {
    const modal = document.getElementById('filters-modal');
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('show'), 10);
}

function closeFilters() {
    const modal = document.getElementById('filters-modal');
    modal.classList.remove('show');
    setTimeout(() => modal.style.display = 'none', 300);
}

function clearFilters() {
    const checkboxes = document.querySelectorAll('#filters-modal input[type="checkbox"]');
    checkboxes.forEach(checkbox => checkbox.checked = false);
    currentFilters = {};
}

function applyFilters() {
    const priceFilters = Array.from(document.querySelectorAll('.price-filters input:checked')).map(cb => cb.value);
    const ratingFilters = Array.from(document.querySelectorAll('.rating-filters input:checked')).map(cb => parseFloat(cb.value));
    const timeFilters = Array.from(document.querySelectorAll('.time-filters input:checked')).map(cb => cb.value);
    
    let filtered = [...restaurants];
    
    // Apply filters
    if (ratingFilters.length > 0) {
        const minRating = Math.min(...ratingFilters);
        filtered = filtered.filter(restaurant => restaurant.rating >= minRating);
    }
    
    displayRestaurants(filtered);
    closeFilters();
    showCustomerToast('success', 'Filters Applied', `Showing ${filtered.length} restaurants`);
}

// Cart functions
function openCart() {
    const cartSidebar = document.getElementById('cart-sidebar');
    cartSidebar.classList.add('open');
    updateCartDisplay();
}

function closeCart() {
    const cartSidebar = document.getElementById('cart-sidebar');
    cartSidebar.classList.remove('open');
}

function updateCartDisplay() {
    const cartContent = document.getElementById('cart-content');
    const cartFooter = document.getElementById('cart-footer');
    const cartCount = document.getElementById('cart-count');
    
    if (cartItems.length === 0) {
        cartContent.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart"></i>
                <p>Your cart is empty</p>
                <span>Add some delicious items to get started</span>
            </div>
        `;
        cartFooter.style.display = 'none';
        cartCount.textContent = '0';
    } else {
        // Display cart items
        const cartHTML = cartItems.map(item => `
            <div class="cart-item">
                <div class="item-info">
                    <h4>${item.name}</h4>
                    <p>$${item.price}</p>
                </div>
                <div class="item-controls">
                    <button onclick="updateCartItem(${item.id}, -1)">-</button>
                    <span>${item.quantity}</span>
                    <button onclick="updateCartItem(${item.id}, 1)">+</button>
                </div>
            </div>
        `).join('');
        
        cartContent.innerHTML = cartHTML;
        cartFooter.style.display = 'block';
        
        const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        document.getElementById('cart-total').textContent = total.toFixed(2);
        cartCount.textContent = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    }
}

function loadCartFromStorage() {
    const savedCart = localStorage.getItem('starkbites_cart');
    if (savedCart) {
        cartItems = JSON.parse(savedCart);
        updateCartDisplay();
    }
}

function saveCartToStorage() {
    localStorage.setItem('starkbites_cart', JSON.stringify(cartItems));
}

function proceedToCheckout() {
    if (cartItems.length === 0) return;
    
    showCustomerToast('info', 'Redirecting', 'Taking you to checkout...');
    window.location.href = 'cart.html';
}

// User menu functions
function toggleUserMenu() {
    const dropdown = document.getElementById('user-dropdown');
    const arrow = document.querySelector('.user-arrow');
    
    if (dropdown.style.display === 'block') {
        closeUserMenu();
    } else {
        dropdown.style.display = 'block';
        arrow.style.transform = 'rotate(180deg)';
        setTimeout(() => dropdown.classList.add('show'), 10);
    }
}

function closeUserMenu() {
    const dropdown = document.getElementById('user-dropdown');
    const arrow = document.querySelector('.user-arrow');
    
    if (dropdown) {
        dropdown.classList.remove('show');
        setTimeout(() => dropdown.style.display = 'none', 300);
    }
    
    if (arrow) {
        arrow.style.transform = 'rotate(0deg)';
    }
}

function handleUserLogout() {
    sessionStorage.removeItem('loggedInUser');
    showCustomerToast('success', 'Logged Out', 'You have been logged out successfully');
    setTimeout(() => {
        location.reload();
    }, 1500);
}

// Promotions
function claimOffer() {
    showCustomerToast('success', 'Offer Claimed!', 'STARK50 promo code has been applied to your account');
}

// Utility functions
function closeAllModals() {
    closeLocationSelector();
    closeFilters();
}

// Toast notification system
function showCustomerToast(type, title, message, duration = 5000) {
    const container = document.getElementById('customer-toast-container');
    const toast = document.createElement('div');
    toast.className = `customer-toast ${type}`;
    
    toast.innerHTML = `
        <div class="toast-content">
            <div class="toast-icon">
                <i class="fas ${getToastIcon(type)}"></i>
            </div>
            <div class="toast-text">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" onclick="removeCustomerToast(this)">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    container.appendChild(toast);
    
    // Show toast
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Auto remove
    setTimeout(() => removeCustomerToast(toast.querySelector('.toast-close')), duration);
}

function getToastIcon(type) {
    switch (type) {
        case 'success': return 'fa-check-circle';
        case 'error': return 'fa-exclamation-circle';
        case 'warning': return 'fa-exclamation-triangle';
        case 'info': return 'fa-info-circle';
        default: return 'fa-info-circle';
    }
}

function removeCustomerToast(closeBtn) {
    const toast = closeBtn.closest('.customer-toast');
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
}