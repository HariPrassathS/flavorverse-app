/* === Admin Dashboard Home === */

let currentSection = 'dashboard';
let sidebarExpanded = true;
let notificationsPanelOpen = false;
let adminMenuOpen = false;

document.addEventListener('DOMContentLoaded', () => {
    // Check authentication first before initializing anything
    if (!checkAdminAuthentication()) {
        return; // Stop execution if not authenticated
    }
    
    initializeAdminDashboard();
    loadDashboardData();
});

// Initialize admin dashboard
function initializeAdminDashboard() {
    // Hide loading screen
    setTimeout(() => {
        const loadingScreen = document.getElementById('admin-loading');
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            setTimeout(() => loadingScreen.style.display = 'none', 500);
        }
    }, 1500);

    // Setup responsive sidebar
    handleResponsiveSidebar();
    window.addEventListener('resize', handleResponsiveSidebar);

    // Close dropdowns when clicking outside
    document.addEventListener('click', (event) => {
        if (!event.target.closest('.admin-profile') && !event.target.closest('.admin-menu')) {
            closeAdminMenu();
        }
        if (!event.target.closest('.admin-notifications-panel') && !event.target.closest('.notification-btn')) {
            closeNotifications();
        }
    });

    // Setup search functionality
    setupSearch();
}

// Check admin authentication
function checkAdminAuthentication() {
    const loggedInUser = sessionStorage.getItem('loggedInUser');
    if (!loggedInUser) {
        showAdminToast('error', 'Authentication Required', 'Please log in to access admin panel');
        setTimeout(() => {
            window.location.href = 'admin_login.html';
        }, 2000);
        return false;
    }

    const user = JSON.parse(loggedInUser);
    if (user.role !== 'ROLE_ADMIN' && user.role !== 'ROLE_SUPER_ADMIN') {
        showAdminToast('error', 'Access Denied', 'Admin privileges required');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        return false;
    }

    // Update UI with admin info
    const adminNameEl = document.getElementById('admin-name');
    if (adminNameEl && user.fullName) {
        adminNameEl.textContent = user.fullName;
    }
    
    return true;
}

// Load dashboard data
async function loadDashboardData() {
    try {
        await updateMetrics();
        await loadRecentActivity();
        await loadTopRestaurants();
        await loadOrdersData();
        
        showAdminToast('success', 'Dashboard Loaded', 'Welcome to the admin dashboard!');
    } catch (error) {
        showAdminToast('error', 'Loading Error', 'Failed to load dashboard data');
    }
}

// Update dashboard metrics
async function updateMetrics() {
    try {
        // Fetch real data from APIs
        const [ordersRes, usersRes, restaurantsRes] = await Promise.all([
            fetch('/api/orders'),
            fetch('/api/users'),
            fetch('/api/restaurants')
        ]);

        const orders = await ordersRes.json();
        const users = await usersRes.json();
        const restaurants = await restaurantsRes.json();

        // Calculate total revenue from orders
        const totalRevenue = orders.reduce((sum, order) => {
            return sum + (order.totalAmount || order.total || 0);
        }, 0);

        // Count delivered orders
        const deliveredOrders = orders.filter(o => 
            o.status === 'DELIVERED' || o.status === 'delivered'
        ).length;

        // Update DOM
        document.getElementById('total-revenue').textContent = `$${totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        document.getElementById('total-orders').textContent = orders.length.toLocaleString();
        document.getElementById('total-users').textContent = users.length.toLocaleString();
        document.getElementById('total-restaurants').textContent = restaurants.length;

        // Calculate growth percentages (compared to previous period - placeholder for now)
        updateMetricChanges(orders.length, users.length);

    } catch (error) {
        console.error('Error updating metrics:', error);
        // Show default values on error
        document.getElementById('total-revenue').textContent = '$0.00';
        document.getElementById('total-orders').textContent = '0';
        document.getElementById('total-users').textContent = '0';
        document.getElementById('total-restaurants').textContent = '0';
    }
}

// Update metric change indicators
function updateMetricChanges(ordersCount, usersCount) {
    // Placeholder - in production, compare with previous period
    const orderChange = document.querySelector('.orders-card .metric-change');
    const userChange = document.querySelector('.users-card .metric-change');
    
    if (orderChange) {
        orderChange.textContent = `↑ ${Math.floor(ordersCount * 0.12)}% from last month`;
    }
    if (userChange) {
        userChange.textContent = `↑ ${Math.floor(usersCount * 0.08)}% from last month`;
    }
}

// Load recent activity from database
async function loadRecentActivity() {
    try {
        const response = await fetch('/api/orders?limit=5&sort=recent');
        if (response.ok) {
            const orders = await response.json();
            const activityList = document.querySelector('.activity-list');
            
            if (activityList && orders.length > 0) {
                // Take last 5 orders for recent activity
                const recentOrders = orders.slice(-5).reverse();
                
                activityList.innerHTML = recentOrders.map(order => {
                    const customerName = order.user?.fullName || order.user?.username || 'Customer';
                    const restaurantName = order.restaurant?.name || 'Restaurant';
                    const timeAgo = getTimeAgo(order.orderDate || order.createdAt);
                    
                    return `
                        <div class="activity-item">
                            <div class="activity-icon new-order">
                                <i class="fas fa-shopping-cart"></i>
                            </div>
                            <div class="activity-content">
                                <p><strong>${customerName}</strong> placed an order at <strong>${restaurantName}</strong></p>
                                <span class="activity-time">${timeAgo}</span>
                            </div>
                        </div>
                    `;
                }).join('');
            }
        }
    } catch (error) {
        console.error('Error loading activity:', error);
    }
}

// Load top restaurants from database
async function loadTopRestaurants() {
    try {
        const response = await fetch('/api/restaurants');
        if (response.ok) {
            const restaurants = await response.json();
            const topList = document.querySelector('.top-restaurants-list');
            
            if (topList && restaurants.length > 0) {
                // Sort by rating and take top 5
                const topRestaurants = restaurants
                    .filter(r => r.rating)
                    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
                    .slice(0, 5);
                
                topList.innerHTML = topRestaurants.map((restaurant, index) => `
                    <div class="restaurant-item">
                        <div class="restaurant-rank">${index + 1}</div>
                        <div class="restaurant-info">
                            <h4>${restaurant.name}</h4>
                            <p>${restaurant.cuisine || restaurant.category || 'Restaurant'}</p>
                        </div>
                        <div class="restaurant-rating">
                            <i class="fas fa-star"></i>
                            <span>${(restaurant.rating || 0).toFixed(1)}</span>
                        </div>
                    </div>
                `).join('');
            }
        }
    } catch (error) {
        console.error('Error loading top restaurants:', error);
    }
}

// Helper function to get time ago
function getTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
}

// Load orders data from database
async function loadOrdersData() {
    const ordersTableBody = document.getElementById('orders-tbody');
    
    try {
        ordersTableBody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 2rem;"><i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: var(--primary-green);"></i><br><br>Loading orders...</td></tr>';
        
        const response = await fetch('/api/orders');
        
        if (!response.ok) {
            throw new Error('Failed to fetch orders');
        }
        
        const orders = await response.json();
        
        if (!orders || orders.length === 0) {
            ordersTableBody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 2rem; color: #666;"><i class="fas fa-inbox" style="font-size: 3rem; color: #ddd; display: block; margin-bottom: 1rem;"></i>No orders found</td></tr>';
            return;
        }

        const ordersHTML = orders.map(order => {
            // Get customer name
            const customerName = order.user?.fullName || order.user?.username || order.customerName || 'Unknown Customer';
            
            // Get restaurant name
            const restaurantName = order.restaurant?.name || order.restaurantName || 'Unknown Restaurant';
            
            // Get order items count
            const itemsCount = order.orderItems?.length || order.items?.length || 0;
            const itemsText = `${itemsCount} item${itemsCount !== 1 ? 's' : ''}`;
            
            // Get total amount
            const total = order.totalAmount || order.total || 0;
            
            // Get status (normalize to lowercase for CSS class)
            const status = (order.status || 'pending').toLowerCase().replace(/ /g, '_');
            
            // Get date
            const orderDate = order.orderDate || order.createdAt || order.date || new Date().toISOString();
            
            return `
                <tr>
                    <td><span class="order-id">#${order.id || order.orderId}</span></td>
                    <td>${customerName}</td>
                    <td>${restaurantName}</td>
                    <td>${itemsText}</td>
                    <td>$${parseFloat(total).toFixed(2)}</td>
                    <td><span class="status-badge ${status}">${formatStatus(status)}</span></td>
                    <td>${formatDate(orderDate)}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="action-btn view-btn" onclick="viewOrderDetails(${order.id})" title="View Details">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="action-btn edit-btn" onclick="editOrder(${order.id})" title="Edit Status">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="action-btn delete-btn" onclick="deleteOrder(${order.id})" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        ordersTableBody.innerHTML = ordersHTML;
        
        // Update orders count in sidebar badge
        const ordersBadge = document.querySelector('.nav-item[onclick*="orders"] .nav-badge');
        if (ordersBadge) {
            const pendingOrders = orders.filter(o => 
                o.status === 'PENDING' || o.status === 'pending' || o.status === 'CONFIRMED' || o.status === 'confirmed'
            ).length;
            ordersBadge.textContent = pendingOrders;
            ordersBadge.style.display = pendingOrders > 0 ? 'block' : 'none';
        }
        
    } catch (error) {
        console.error('Error loading orders:', error);
        ordersTableBody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 2rem; color: #e74c3c;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 1rem; display: block;"></i>
                    <strong>Error loading orders</strong><br>
                    <span style="color: #666; font-size: 0.9rem;">${error.message}</span><br><br>
                    <button onclick="loadOrdersData()" class="btn-primary" style="padding: 0.5rem 1.5rem; cursor: pointer;">
                        <i class="fas fa-sync-alt"></i> Retry
                    </button>
                </td>
            </tr>
        `;
    }
}

// Format order status
function formatStatus(status) {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Show/hide sections
function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });

    // Remove active class from all nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });

    // Show selected section
    const targetSection = document.getElementById(`${sectionName}-section`);
    if (targetSection) {
        targetSection.classList.add('active');
    }

    // Add active class to selected nav item
    const targetNavItem = document.querySelector(`[onclick="showSection('${sectionName}')"]`);
    if (targetNavItem) {
        targetNavItem.classList.add('active');
    }

    // Update page title
    const pageTitle = document.getElementById('page-title');
    if (pageTitle) {
        pageTitle.textContent = sectionName.charAt(0).toUpperCase() + sectionName.slice(1);
    }

    currentSection = sectionName;

    // Load section-specific data
    loadSectionData(sectionName);
}

// Load section-specific data
function loadSectionData(sectionName) {
    switch (sectionName) {
        case 'orders':
            loadOrdersData();
            break;
        case 'restaurants':
            // Load restaurants data
            break;
        case 'users':
            // Load users data
            break;
        case 'delivery':
            // Load delivery partners data
            break;
        case 'analytics':
            // Load analytics data
            break;
        case 'settings':
            // Load settings
            break;
        default:
            // Dashboard already loads on init
            break;
    }
}

// Toggle sidebar
function toggleSidebar() {
    const sidebar = document.getElementById('admin-sidebar');
    const main = document.querySelector('.admin-main');
    
    sidebarExpanded = !sidebarExpanded;
    
    if (sidebarExpanded) {
        sidebar.classList.remove('collapsed');
        main.classList.remove('sidebar-collapsed');
    } else {
        sidebar.classList.add('collapsed');
        main.classList.add('sidebar-collapsed');
    }
}

// Handle responsive sidebar
function handleResponsiveSidebar() {
    const sidebar = document.getElementById('admin-sidebar');
    const main = document.querySelector('.admin-main');
    
    if (window.innerWidth <= 768) {
        sidebar.classList.add('mobile');
        main.classList.add('mobile');
    } else {
        sidebar.classList.remove('mobile');
        main.classList.remove('mobile');
    }
}

// Toggle notifications panel
function toggleNotifications() {
    const panel = document.getElementById('admin-notifications');
    notificationsPanelOpen = !notificationsPanelOpen;
    
    if (notificationsPanelOpen) {
        panel.style.display = 'block';
        setTimeout(() => panel.classList.add('show'), 10);
    } else {
        closeNotifications();
    }
}

// Close notifications panel
function closeNotifications() {
    const panel = document.getElementById('admin-notifications');
    panel.classList.remove('show');
    setTimeout(() => panel.style.display = 'none', 300);
    notificationsPanelOpen = false;
}

// Toggle admin menu
function toggleAdminMenu() {
    const menu = document.getElementById('admin-menu');
    adminMenuOpen = !adminMenuOpen;
    
    if (adminMenuOpen) {
        menu.style.display = 'block';
        setTimeout(() => menu.classList.add('show'), 10);
    } else {
        closeAdminMenu();
    }
}

// Close admin menu
function closeAdminMenu() {
    const menu = document.getElementById('admin-menu');
    if (menu) {
        menu.classList.remove('show');
        setTimeout(() => menu.style.display = 'none', 300);
    }
    adminMenuOpen = false;
}

// Setup search functionality
function setupSearch() {
    const searchInput = document.querySelector('.search-input');
    const searchBtn = document.querySelector('.search-btn');
    
    searchInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            performSearch(searchInput.value);
        }
    });
    
    searchBtn.addEventListener('click', () => {
        performSearch(searchInput.value);
    });
}

// Perform search
function performSearch(query) {
    if (!query.trim()) return;
    
    showAdminToast('info', 'Searching', `Searching for "${query}"...`);
    
    // Simulate search functionality
    setTimeout(() => {
        showAdminToast('success', 'Search Complete', `Found results for "${query}"`);
    }, 1000);
}

// Order management functions
// View order details - navigate to order management page
async function viewOrderDetails(orderId) {
    try {
        const response = await fetch(`/api/orders/${orderId}`);
        if (response.ok) {
            // Navigate to order details page or show modal
            window.location.href = `admin_reviews.html?order=${orderId}`;
        } else {
            showAdminToast('error', 'Error', 'Failed to load order details');
        }
    } catch (error) {
        console.error('Error viewing order:', error);
        showAdminToast('error', 'Error', 'Unable to view order details');
    }
}

// Edit order status
async function editOrder(orderId) {
    const newStatus = prompt('Enter new status:\n\nOptions:\n- PENDING\n- CONFIRMED\n- PREPARING\n- OUT_FOR_DELIVERY\n- DELIVERED\n- CANCELLED');
    
    if (newStatus) {
        try {
            const response = await fetch(`/api/orders/${orderId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus.toUpperCase() })
            });
            
            if (response.ok) {
                showAdminToast('success', 'Order Updated', `Order #${orderId} status changed to ${newStatus}`);
                loadOrdersData(); // Reload orders to show new status
            } else {
                const error = await response.text();
                showAdminToast('error', 'Update Failed', error);
            }
        } catch (error) {
            console.error('Error updating order:', error);
            showAdminToast('error', 'Update Failed', 'Unable to update order status');
        }
    }
}

// Delete order
async function deleteOrder(orderId) {
    if (!confirm(`Are you sure you want to delete order #${orderId}?\n\nThis action cannot be undone.`)) {
        return;
    }
    
    try {
        const response = await fetch(`/api/orders/${orderId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showAdminToast('success', 'Order Deleted', `Order #${orderId} has been deleted`);
            loadOrdersData(); // Reload orders
            updateMetrics(); // Update metrics
        } else {
            const error = await response.text();
            showAdminToast('error', 'Delete Failed', error);
        }
    } catch (error) {
        console.error('Error deleting order:', error);
        showAdminToast('error', 'Delete Failed', 'Unable to delete order');
    }
}

// Admin logout
function handleAdminLogout() {
    if (confirm('Are you sure you want to logout?')) {
        sessionStorage.removeItem('loggedInUser');
        showAdminToast('success', 'Logged Out', 'You have been logged out successfully');
        setTimeout(() => {
            window.location.href = 'admin_login.html';
        }, 1500);
    }
}

// Admin toast notification system
function showAdminToast(type, title, message, duration = 5000) {
    const container = document.getElementById('admin-toast-container');
    const toast = document.createElement('div');
    toast.className = `admin-toast ${type}`;
    
    toast.innerHTML = `
        <div class="toast-content">
            <div class="toast-icon">
                <i class="fas ${getToastIcon(type)}"></i>
            </div>
            <div class="toast-text">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" onclick="removeAdminToast(this)">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    container.appendChild(toast);
    
    // Show toast
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Auto remove
    setTimeout(() => removeAdminToast(toast.querySelector('.toast-close')), duration);
}

// Get toast icon
function getToastIcon(type) {
    switch (type) {
        case 'success': return 'fa-check-circle';
        case 'error': return 'fa-exclamation-circle';
        case 'warning': return 'fa-exclamation-triangle';
        case 'info': return 'fa-info-circle';
        default: return 'fa-info-circle';
    }
}

// Remove admin toast
function removeAdminToast(closeBtn) {
    const toast = closeBtn.closest('.admin-toast');
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
}