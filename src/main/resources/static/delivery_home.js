/* === Delivery Partner Home Dashboard === */

let deliveryStatus = true;
let onlineStartTime = null;
let statsInterval = null;
let notificationsOpen = false;
let profileMenuOpen = false;

document.addEventListener('DOMContentLoaded', () => {
    // Check authentication first before initializing anything
    if (!checkAuthentication()) {
        return; // Stop execution if not authenticated
    }
    
    initializeDeliveryHome();
    loadPartnerData();
    startStatsUpdates();
    loadOrders();
});

// Initialize delivery home dashboard
function initializeDeliveryHome() {
    // Hide loading screen after page loads
    setTimeout(() => {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            setTimeout(() => loadingScreen.style.display = 'none', 500);
        }
    }, 1500);

    // Start online timer
    onlineStartTime = new Date();
    updateOnlineTime();
    setInterval(updateOnlineTime, 60000); // Update every minute

    // Close dropdowns when clicking outside
    document.addEventListener('click', (event) => {
        if (!event.target.closest('.profile-menu')) {
            closeProfileMenu();
        }
        if (!event.target.closest('.notification-panel') && !event.target.closest('.notification-btn')) {
            closeNotifications();
        }
    });
}

// Check authentication and redirect if needed
function checkAuthentication() {
    const loggedInUser = sessionStorage.getItem('loggedInUser');
    if (!loggedInUser) {
        showToast('error', 'Authentication Required', 'Please log in to continue');
        setTimeout(() => {
            window.location.href = 'delivery_login.html';
        }, 2000);
        return false;
    }

    const user = JSON.parse(loggedInUser);
    if (user.role !== 'ROLE_DELIVERY_PARTNER') {
        showToast('error', 'Access Denied', 'This page is for delivery partners only');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        return false;
    }

    // Update UI with user info
    const partnerNameEl = document.getElementById('partner-name');
    if (partnerNameEl && user.fullName) {
        partnerNameEl.textContent = user.fullName;
    }
    
    return true;
}

// Load partner data and stats
async function loadPartnerData() {
    const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser') || '{}');
    
    try {
        await updateDashboardStats();
        showToast('success', 'Dashboard Loaded', 'Welcome back to your delivery dashboard!');
    } catch (error) {
        console.error('Error loading partner data:', error);
        showToast('error', 'Loading Error', 'Failed to load dashboard data');
    }
}

// Update dashboard statistics from database
async function updateDashboardStats() {
    try {
        const loggedInUser = sessionStorage.getItem('loggedInUser');
        if (!loggedInUser) return;
        
        const user = JSON.parse(loggedInUser);
        
        // Fetch delivery partner's orders
        const response = await fetch(`/api/delivery/my-orders/${user.id}`);
        
        if (response.ok) {
            const orders = await response.json();
            
            // Calculate today's earnings
            const today = new Date().toDateString();
            const todayOrders = orders.filter(order => {
                const orderDate = new Date(order.orderDate || order.createdAt);
                return orderDate.toDateString() === today && 
                       (order.status === 'DELIVERED' || order.status === 'delivered');
            });
            
            const todayEarnings = todayOrders.reduce((sum, order) => {
                return sum + (order.deliveryFee || 2.99);
            }, 0);
            
            // Count total completed deliveries
            const completedOrders = orders.filter(order => 
                order.status === 'DELIVERED' || order.status === 'delivered'
            ).length;
            
            // Calculate average rating (placeholder - would come from ratings table)
            const avgRating = 4.7; // Default, should fetch from ratings
            
            // Update DOM
            document.getElementById('today-earnings').textContent = `$${todayEarnings.toFixed(2)}`;
            document.getElementById('total-orders').textContent = completedOrders;
            document.getElementById('avg-rating').textContent = avgRating.toFixed(1);
            
            // Update active orders count
            const activeOrders = orders.filter(order => {
                const status = (order.status || '').toUpperCase();
                return status === 'OUT_FOR_DELIVERY' || status === 'PREPARING' || status === 'CONFIRMED';
            }).length;
            
            document.getElementById('active-count').textContent = activeOrders;
            
        } else {
            throw new Error('Failed to fetch partner stats');
        }
    } catch (error) {
        console.error('Error updating stats:', error);
        // Show defaults on error
        document.getElementById('today-earnings').textContent = '$0.00';
        document.getElementById('total-orders').textContent = '0';
        document.getElementById('avg-rating').textContent = '4.5';
        document.getElementById('active-count').textContent = '0';
    }
}

// Update online time display
function updateOnlineTime() {
    if (!onlineStartTime) return;
    
    const now = new Date();
    const diff = now - onlineStartTime;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    document.getElementById('online-time').textContent = `${hours}h ${minutes}m`;
}

// Start periodic stats updates
function startStatsUpdates() {
    statsInterval = setInterval(updateDashboardStats, 30000); // Update every 30 seconds
}

// Toggle delivery status
function toggleDeliveryStatus() {
    const statusSwitch = document.getElementById('delivery-status');
    deliveryStatus = statusSwitch.checked;
    
    if (deliveryStatus) {
        onlineStartTime = new Date();
        showToast('success', 'You\'re Online', 'You can now receive delivery orders');
        loadOrders(); // Refresh available orders
    } else {
        showToast('info', 'You\'re Offline', 'You won\'t receive new orders');
        clearAvailableOrders();
    }
}

// Load available and active orders
async function loadOrders() {
    if (!deliveryStatus) return;

    try {
        await loadAvailableOrders();
        await loadActiveOrders();
    } catch (error) {
        showToast('error', 'Order Loading Error', 'Failed to load orders');
    }
}

// Load available orders from database
async function loadAvailableOrders() {
    const availableOrdersEl = document.getElementById('available-orders');
    
    try {
        availableOrdersEl.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i><p>Loading available orders...</p></div>';
        
        // Fetch orders that need delivery assignment
        const response = await fetch('/api/delivery/available-orders');
        
        if (!response.ok) {
            throw new Error('Failed to fetch available orders');
        }
        
        const orders = await response.json();
        
        if (!orders || orders.length === 0) {
            availableOrdersEl.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-clipboard-check"></i>
                    <p>No orders available</p>
                    <span>Check back soon for new delivery requests</span>
                </div>
            `;
            return;
        }

        const ordersHTML = orders.map(order => {
            const restaurantName = order.restaurant?.name || 'Restaurant';
            const customerName = order.user?.fullName || order.user?.username || 'Customer';
            const itemsCount = order.orderItems?.length || order.items?.length || 0;
            const totalAmount = order.totalAmount || order.total || 0;
            const deliveryFee = order.deliveryFee || 2.99;
            const address = order.deliveryAddress || order.address || 'Address not provided';
            
            return `
                <div class="order-card available-order" onclick="showOrderDetails('${order.id}', 'available')">
                    <div class="order-header">
                        <div class="order-id">#${order.id}</div>
                        <div class="order-payment">$${(totalAmount + deliveryFee).toFixed(2)}</div>
                    </div>
                    <div class="order-restaurant">
                        <i class="fas fa-store"></i> ${restaurantName}
                    </div>
                    <div class="order-customer">
                        <i class="fas fa-user"></i> ${customerName}
                    </div>
                    <div class="order-details">
                        <span class="order-items"><i class="fas fa-box"></i> ${itemsCount} items</span>
                        <span class="order-distance"><i class="fas fa-route"></i> Calculate route</span>
                    </div>
                    <div class="order-address">
                        <i class="fas fa-map-marker-alt"></i> ${address}
                    </div>
                    <div class="order-actions">
                        <button class="btn-accept" onclick="acceptOrder(event, ${order.id})">
                            <i class="fas fa-check"></i> Accept ($${deliveryFee.toFixed(2)})
                        </button>
                        <button class="btn-details" onclick="showOrderDetails(event, ${order.id}, 'available')">
                            <i class="fas fa-info"></i> Details
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        availableOrdersEl.innerHTML = ordersHTML;
        
    } catch (error) {
        console.error('Error loading available orders:', error);
        availableOrdersEl.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error loading orders</p>
                <span>${error.message}</span>
                <button onclick="loadAvailableOrders()" class="btn-retry" style="margin-top: 1rem; padding: 0.5rem 1rem; background: var(--primary-green); color: white; border: none; border-radius: 8px; cursor: pointer;">
                    <i class="fas fa-sync-alt"></i> Retry
                </button>
            </div>
        `;
    }
}

// Load active orders from database
async function loadActiveOrders() {
    const activeOrdersEl = document.getElementById('active-orders');
    const activeCountEl = document.getElementById('active-count');
    
    try {
        // Get current user from session
        const loggedInUser = sessionStorage.getItem('loggedInUser');
        if (!loggedInUser) return;
        
        const user = JSON.parse(loggedInUser);
        
        // Fetch orders assigned to this delivery partner
        const response = await fetch(`/api/delivery/my-orders/${user.id}`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch active orders');
        }
        
        const orders = await response.json();
        
        // Filter only active orders (not delivered/cancelled)
        const activeOrders = orders.filter(order => {
            const status = (order.status || '').toUpperCase();
            return status === 'OUT_FOR_DELIVERY' || status === 'PREPARING' || status === 'CONFIRMED';
        });
        
        activeCountEl.textContent = activeOrders.length;
        
        if (activeOrders.length === 0) {
            activeOrdersEl.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-truck"></i>
                    <p>No active deliveries</p>
                    <span>Accept orders to start delivering</span>
                </div>
            `;
            return;
        }

        const ordersHTML = activeOrders.map(order => {
            const restaurantName = order.restaurant?.name || 'Restaurant';
            const customerName = order.user?.fullName || order.user?.username || 'Customer';
            const address = order.deliveryAddress || order.address || 'Address not provided';
            const status = order.status || 'CONFIRMED';
            
            return `
                <div class="order-card active-order">
                    <div class="order-header">
                        <div class="order-id">#${order.id}</div>
                        <div class="order-status ${status.toLowerCase()}">${formatOrderStatus(status)}</div>
                    </div>
                    <div class="order-restaurant">
                        <i class="fas fa-store"></i> ${restaurantName}
                    </div>
                    <div class="order-customer">
                        <i class="fas fa-user"></i> ${customerName}
                    </div>
                    <div class="order-address">
                        <i class="fas fa-map-marker-alt"></i> ${address}
                    </div>
                    <div class="order-actions" style="margin-top: 1rem;">
                        ${status === 'OUT_FOR_DELIVERY' ? 
                            `<button class="btn-complete" onclick="completeDelivery(${order.id})" style="width: 100%; padding: 0.75rem; background: var(--primary-green); color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">
                                <i class="fas fa-check-circle"></i> Mark as Delivered
                            </button>` :
                            `<button class="btn-start" onclick="startDelivery(${order.id})" style="width: 100%; padding: 0.75rem; background: #667eea; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">
                                <i class="fas fa-shipping-fast"></i> Start Delivery
                            </button>`
                        }
                    </div>
                </div>
            `;
        }).join('');

        activeOrdersEl.innerHTML = ordersHTML;
        
    } catch (error) {
        console.error('Error loading active orders:', error);
        activeCountEl.textContent = '0';
        activeOrdersEl.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error loading active orders</p>
                <button onclick="loadActiveOrders()" class="btn-retry" style="padding: 0.5rem 1rem; background: var(--primary-green); color: white; border: none; border-radius: 8px; cursor: pointer;">
                    <i class="fas fa-sync-alt"></i> Retry
                </button>
            </div>
        `;
    }
}

// Format order status for display
function formatOrderStatus(status) {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// Accept an order
async function acceptOrder(event, orderId) {
    event.stopPropagation();
    
    try {
        const loggedInUser = sessionStorage.getItem('loggedInUser');
        if (!loggedInUser) {
            showToast('error', 'Authentication Error', 'Please log in again');
            return;
        }
        
        const user = JSON.parse(loggedInUser);
        
        const response = await fetch(`/api/delivery/accept-order/${orderId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ deliveryPartnerId: user.id })
        });
        
        if (response.ok) {
            showToast('success', 'Order Accepted', `Order #${orderId} has been accepted`);
            
            // Reload orders after short delay
            setTimeout(() => {
                loadOrders();
                loadPartnerData(); // Update stats
            }, 1000);
        } else {
            const error = await response.text();
            showToast('error', 'Accept Failed', error);
        }
    } catch (error) {
        console.error('Error accepting order:', error);
        showToast('error', 'Accept Failed', 'Unable to accept order');
    }
}

// Start delivery
async function startDelivery(orderId) {
    try {
        const response = await fetch(`/api/delivery/start-delivery/${orderId}`, {
            method: 'POST'
        });
        
        if (response.ok) {
            showToast('success', 'Delivery Started', `Started delivery for order #${orderId}`);
            loadOrders();
        } else {
            showToast('error', 'Error', 'Failed to start delivery');
        }
    } catch (error) {
        console.error('Error starting delivery:', error);
        showToast('error', 'Error', 'Unable to start delivery');
    }
}

// Complete delivery
async function completeDelivery(orderId) {
    if (!confirm(`Mark order #${orderId} as delivered?`)) {
        return;
    }
    
    try {
        const response = await fetch(`/api/delivery/complete-delivery/${orderId}`, {
            method: 'POST'
        });
        
        if (response.ok) {
            showToast('success', 'Delivery Completed', `Order #${orderId} marked as delivered`);
            loadOrders();
            loadPartnerData(); // Update earnings
        } else {
            showToast('error', 'Error', 'Failed to complete delivery');
        }
    } catch (error) {
        console.error('Error completing delivery:', error);
        showToast('error', 'Error', 'Unable to complete delivery');
    }
}

// Show order details modal
function showOrderDetails(event, orderId, type) {
    if (event) event.stopPropagation();
    
    const modal = document.getElementById('order-modal');
    const modalBody = document.getElementById('order-modal-body');
    const actionBtn = document.getElementById('order-action-btn');
    
    // Sample order details
    const orderDetails = {
        id: orderId,
        restaurant: 'Pizza Palace',
        customer: 'John Smith',
        phone: '+1 (555) 123-4567',
        items: [
            { name: 'Large Pepperoni Pizza', qty: 1, price: 16.99 },
            { name: 'Coca Cola 2L', qty: 1, price: 3.99 }
        ],
        subtotal: 20.98,
        tax: 1.52,
        tip: 2.50,
        total: 25.00,
        address: '123 Main St, Downtown',
        notes: 'Please ring doorbell, apartment 2B'
    };
    
    modalBody.innerHTML = `
        <div class="order-detail-section">
            <h4><i class="fas fa-receipt"></i> Order #${orderDetails.id}</h4>
            <div class="detail-grid">
                <div class="detail-item">
                    <span class="detail-label">Restaurant:</span>
                    <span class="detail-value">${orderDetails.restaurant}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Customer:</span>
                    <span class="detail-value">${orderDetails.customer}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Phone:</span>
                    <span class="detail-value">${orderDetails.phone}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Address:</span>
                    <span class="detail-value">${orderDetails.address}</span>
                </div>
            </div>
        </div>
        
        <div class="order-detail-section">
            <h4><i class="fas fa-list"></i> Order Items</h4>
            <div class="items-list">
                ${orderDetails.items.map(item => `
                    <div class="item-row">
                        <span class="item-name">${item.qty}x ${item.name}</span>
                        <span class="item-price">$${item.price.toFixed(2)}</span>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <div class="order-detail-section">
            <h4><i class="fas fa-calculator"></i> Payment Details</h4>
            <div class="payment-breakdown">
                <div class="payment-row">
                    <span>Subtotal:</span>
                    <span>$${orderDetails.subtotal.toFixed(2)}</span>
                </div>
                <div class="payment-row">
                    <span>Tax:</span>
                    <span>$${orderDetails.tax.toFixed(2)}</span>
                </div>
                <div class="payment-row">
                    <span>Tip:</span>
                    <span>$${orderDetails.tip.toFixed(2)}</span>
                </div>
                <div class="payment-row total">
                    <span>Total:</span>
                    <span>$${orderDetails.total.toFixed(2)}</span>
                </div>
            </div>
        </div>
        
        ${orderDetails.notes ? `
            <div class="order-detail-section">
                <h4><i class="fas fa-sticky-note"></i> Special Notes</h4>
                <p class="order-notes">${orderDetails.notes}</p>
            </div>
        ` : ''}
    `;
    
    // Update action button based on order type
    if (type === 'available') {
        actionBtn.textContent = 'Accept Order';
        actionBtn.onclick = () => {
            acceptOrder(null, orderId);
            closeOrderModal();
        };
    } else {
        actionBtn.textContent = 'Mark Delivered';
        actionBtn.onclick = () => {
            markDelivered(orderId);
            closeOrderModal();
        };
    }
    
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('show'), 10);
}

// Close order modal
function closeOrderModal() {
    const modal = document.getElementById('order-modal');
    modal.classList.remove('show');
    setTimeout(() => modal.style.display = 'none', 300);
}

// Handle order action
function handleOrderAction() {
    // This function is set dynamically in showOrderDetails
}

// Mark order as delivered
function markDelivered(orderId) {
    showToast('success', 'Order Delivered', `Order #${orderId} marked as delivered`);
    loadOrders();
}

// Refresh orders
function refreshOrders() {
    showToast('info', 'Refreshing', 'Loading latest orders...');
    loadOrders();
}

// Clear available orders when offline
function clearAvailableOrders() {
    const availableOrdersEl = document.getElementById('available-orders');
    availableOrdersEl.innerHTML = `
        <div class="empty-state offline">
            <i class="fas fa-moon"></i>
            <p>You're currently offline</p>
            <span>Toggle status to online to see available orders</span>
        </div>
    `;
}

// Toggle notifications panel
function toggleNotifications() {
    const panel = document.getElementById('notification-panel');
    notificationsOpen = !notificationsOpen;
    
    if (notificationsOpen) {
        panel.style.display = 'block';
        setTimeout(() => panel.classList.add('show'), 10);
    } else {
        closeNotifications();
    }
}

// Close notifications panel
function closeNotifications() {
    const panel = document.getElementById('notification-panel');
    panel.classList.remove('show');
    setTimeout(() => panel.style.display = 'none', 300);
    notificationsOpen = false;
}

// Toggle profile menu
function toggleProfileMenu() {
    const dropdown = document.getElementById('profile-dropdown');
    const arrow = document.querySelector('.profile-arrow');
    
    profileMenuOpen = !profileMenuOpen;
    
    if (profileMenuOpen) {
        dropdown.style.display = 'block';
        arrow.style.transform = 'rotate(180deg)';
        setTimeout(() => dropdown.classList.add('show'), 10);
    } else {
        closeProfileMenu();
    }
}

// Close profile menu
function closeProfileMenu() {
    const dropdown = document.getElementById('profile-dropdown');
    const arrow = document.querySelector('.profile-arrow');
    
    if (dropdown) {
        dropdown.classList.remove('show');
        setTimeout(() => dropdown.style.display = 'none', 300);
    }
    
    if (arrow) {
        arrow.style.transform = 'rotate(0deg)';
    }
    
    profileMenuOpen = false;
}

// Quick action handlers
function openMapView() {
    showToast('info', 'Map View', 'Opening map interface...');
    // Implement map view
}

function openEarnings() {
    showToast('info', 'Earnings Report', 'Loading earnings data...');
    // Implement earnings page
}

function openSupport() {
    showToast('info', 'Support Center', 'Connecting to support...');
    // Implement support chat
}

function openProfile() {
    window.location.href = 'delivery_profile.html';
}

// Handle logout
function handleLogout() {
    sessionStorage.removeItem('loggedInUser');
    showToast('success', 'Logged Out', 'You have been logged out successfully');
    setTimeout(() => {
        window.location.href = 'delivery_login.html';
    }, 1500);
}

// Toast notification system
function showToast(type, title, message, duration = 5000) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    toast.innerHTML = `
        <div class="toast-content">
            <div class="toast-icon">
                <i class="fas ${getToastIcon(type)}"></i>
            </div>
            <div class="toast-text">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" onclick="removeToast(this)">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    container.appendChild(toast);
    
    // Show toast
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Auto remove
    setTimeout(() => removeToast(toast.querySelector('.toast-close')), duration);
}

// Get toast icon based on type
function getToastIcon(type) {
    switch (type) {
        case 'success': return 'fa-check-circle';
        case 'error': return 'fa-exclamation-circle';
        case 'warning': return 'fa-exclamation-triangle';
        case 'info': return 'fa-info-circle';
        default: return 'fa-info-circle';
    }
}

// Remove toast
function removeToast(closeBtn) {
    const toast = closeBtn.closest('.toast');
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (statsInterval) {
        clearInterval(statsInterval);
    }
});