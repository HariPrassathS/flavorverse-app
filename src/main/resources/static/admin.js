// --- Globals ---
let allAdminOrders = [];
let availablePartners = [];

document.addEventListener('DOMContentLoaded', () => {
    const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));
    if (!loggedInUser || loggedInUser.role !== 'ROLE_SUPER_ADMIN') {
        Toastify({ text: 'You do not have permission.', duration: 3000, gravity: "bottom", position: "right", style: { background: "linear-gradient(to right, #ff5f6d, #ffc371)" }}).showToast();
        setTimeout(() => { window.location.href = '/admin_login.html'; }, 2000);
        return;
    }
    
    // Fetch initial data
    fetchInitialData();
});

// Fetch both orders and partners
function fetchInitialData() {
    Promise.all([
        fetch('/api/orders').then(res => res.ok ? res.json() : Promise.reject('Failed to load orders')),
        fetch('/api/delivery/available').then(res => res.ok ? res.json() : Promise.reject('Failed to load partners'))
    ])
    .then(([orders, partners]) => {
        allAdminOrders = orders;
        availablePartners = partners;
        displayOrders(orders); // Render the table initially
    })
    .catch(error => {
        console.error('Error fetching initial data:', error);
        document.getElementById('orders-container').innerHTML = `<p style="color: red;">Failed to load data. ${error}</p>`;
        Toastify({ text: `Failed to load data: ${error}`, duration: 3000, gravity: "bottom", position: "right", style: { background: "linear-gradient(to right, #ff5f6d, #ffc371)" }}).showToast();
    });
}

// Function to render the orders table
function displayOrders(orders) {
    const container = document.getElementById('orders-container');
    container.innerHTML = ''; // Clear previous table
    if (!orders || orders.length === 0) {
        container.innerHTML = '<p>No orders have been placed yet.</p>';
        return;
    }
    
    const table = document.createElement('table');
    table.style.width = '100%';
    table.innerHTML = `
        <thead>
            <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Details</th> 
                <th>Total</th>
                <th>Status</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody></tbody>
    `;
    const tbody = table.querySelector('tbody');

    orders.forEach(order => {
        const row = document.createElement('tr');
        row.id = `order-row-${order.id}`; // Add an ID to each row for easy updates
        
        // Render the row content using a helper function
        row.innerHTML = generateOrderRowHtml(order); 
        
        tbody.appendChild(row);
    });
    container.appendChild(table);
}

// Helper function to generate HTML for a single order row
function generateOrderRowHtml(order) {
    const currentStatus = order.status;
    const customerName = order.user?.fullName || order.user?.username || 'N/A';
    const customerPhone = order.user?.phoneNo || '';
    const customerAddress = order.user?.address || '';

    // Status update dropdown
    let statusUpdateHtml = `
        <div class="action-group">
            <select id="select-status-${order.id}" class="status-dropdown">
                <option value="PLACED" ${currentStatus === 'PLACED' ? 'selected' : ''}>Placed</option>
                <option value="PREPARING" ${currentStatus === 'PREPARING' ? 'selected' : ''}>Preparing</option>
                <option value="OUT FOR DELIVERY" ${currentStatus === 'OUT FOR DELIVERY' ? 'selected disabled' : 'disabled'}>Out for Delivery</option>
                <option value="DELIVERED" ${currentStatus === 'DELIVERED' ? 'selected' : ''}>Delivered</option>
                <option value="CANCELLED" ${currentStatus === 'CANCELLED' ? 'selected' : ''}>Cancelled</option>
            </select>
            <button class="btn btn-small" onclick="updateOrderStatus(${order.id})">Update Status</button>
        </div>
    `;

    // Partner assignment dropdown (only if status is PREPARING)
    let partnerAssignHtml = '';
    if (currentStatus === 'PREPARING') {
        let partnerOptions = '<option value="">Select Partner</option>';
        availablePartners.forEach(partner => {
            // --- ITHU THAAN PUTHU CHANGE ---
            // Namma ippa DTO-la irunthu `fullName` edukrom
            const partnerName = partner.fullName || `Partner #${partner.id}`; 
            partnerOptions += `<option value="${partner.id}">${partnerName}</option>`;
        });

        partnerAssignHtml = `
            <div class="action-group" style="margin-top: 5px;">
                <select id="select-partner-${order.id}" class="status-dropdown">
                    ${partnerOptions}
                </select>
                <button class="btn btn-small" onclick="assignPartner(${order.id})">Assign Partner</button>
            </div>
        `;
    }

    // Combine actions
    const actionsHtml = statusUpdateHtml + partnerAssignHtml;

    // Return the full row HTML
    return `
        <td>#${order.id}</td>
        <td>
            <strong>${customerName}</strong><br>
            ${customerPhone}<br>
            <small>${customerAddress}</small>
        </td>
        <td><button class="btn btn-small" onclick="showOrderDetails(${order.id})">View Items</button></td>
        <td>₹${order.totalPrice.toFixed(2)}</td>
        <td><span class="status-badge status-${currentStatus.toLowerCase().replace(/\s+/g, '-')}" id="status-${order.id}">${currentStatus}</span></td>
        <td>${actionsHtml}</td>
    `;
}


// --- UPDATE PANNA FUNCTIONS (No Reload) ---

function assignPartner(orderId) {
    const selectElement = document.getElementById(`select-partner-${orderId}`);
    const partnerId = selectElement.value;

    if (!partnerId) {
        Toastify({ text: 'Please select a delivery partner.', duration: 3000, gravity: "bottom", position: "right", style: { background: "linear-gradient(to right, #ff5f6d, #ffc371)" }}).showToast();
        return;
    }

    fetch(`/api/orders/assign-delivery/${orderId}/${partnerId}`, { method: 'PUT' })
    .then(response => {
        if (!response.ok) return response.text().then(text => { throw new Error(text || 'Assign failed') });
        return response.json();
    })
    .then(updatedOrder => {
        Toastify({ text: 'Partner assigned successfully!', duration: 3000, gravity: "bottom", position: "right", style: { background: "linear-gradient(to right, #00b09b, #96c93d)" }}).showToast();
        
        // Update the order in our local array
        const index = allAdminOrders.findIndex(o => o.id === orderId);
        if (index !== -1) allAdminOrders[index] = updatedOrder;
        
        // Update only the affected row in the table
        const row = document.getElementById(`order-row-${orderId}`);
        if (row) row.innerHTML = generateOrderRowHtml(updatedOrder);

        // Refresh available partners list as one is now busy
        fetchAvailablePartners(); 
    })
    .catch(error => {
        console.error('Error assigning partner:', error);
        Toastify({ text: `Failed to assign partner: ${error.message}`, duration: 3000, gravity: "bottom", position: "right", style: { background: "linear-gradient(to right, #ff5f6d, #ffc371)" }}).showToast();
    });
}

function updateOrderStatus(orderId) {
    const selectElement = document.getElementById(`select-status-${orderId}`);
    const newStatus = selectElement.value;

    if (newStatus === 'OUT FOR DELIVERY') {
        Toastify({ text: 'Please use "Assign Partner" button.', duration: 3000, gravity: "bottom", position: "right", style: { background: "linear-gradient(to right, #ff5f6d, #ffc371)" }}).showToast();
        // Reset dropdown to original status if possible
        const order = allAdminOrders.find(o => o.id === orderId);
        if(order) selectElement.value = order.status;
        return;
    }

    fetch(`/api/orders/update-status/${orderId}?status=${newStatus}`, { method: 'PUT' })
    .then(response => {
        if (!response.ok) throw new Error('Status update failed');
        return response.json();
    })
    .then(updatedOrder => {
        Toastify({ text: 'Order status updated successfully!', duration: 3000, gravity: "bottom", position: "right", style: { background: "linear-gradient(to right, #00b09b, #96c93d)" }}).showToast();

        // Update the order in our local array
        const index = allAdminOrders.findIndex(o => o.id === orderId);
        if (index !== -1) allAdminOrders[index] = updatedOrder;

        // Update only the affected row
        const row = document.getElementById(`order-row-${orderId}`);
        if (row) row.innerHTML = generateOrderRowHtml(updatedOrder);

        // If status changed to DELIVERED/CANCELLED, the partner might become free
        if (newStatus === 'DELIVERED' || newStatus === 'CANCELLED') {
             fetchAvailablePartners();
        }
    })
    .catch(error => {
        console.error('Error updating status:', error);
        Toastify({ text: 'Failed to update order status.', duration: 3000, gravity: "bottom", position: "right", style: { background: "linear-gradient(to right, #ff5f6d, #ffc371)" }}).showToast();
         // Reset dropdown on error
        const order = allAdminOrders.find(o => o.id === orderId);
        if(order) selectElement.value = order.status;
    });
}

// Helper to refresh partner list (used after assign/deliver)
function fetchAvailablePartners() {
     fetch('/api/delivery/available')
        .then(res => res.ok ? res.json() : Promise.reject('Failed to refresh partners'))
        .then(partners => {
            availablePartners = partners;
            // Optionally re-render affected dropdowns if needed, 
            // but usually not necessary unless many admins are working at once.
        })
        .catch(error => {
             console.error('Error refreshing partners:', error);
             // Maybe show a subtle toast
        });
}


// --- Modal and Logout Functions (No major changes) ---
function showOrderDetails(orderId) {
    // ... (same as before)
    const order = allAdminOrders.find(o => o.id === orderId);
    if (!order) return;
    const modal = document.getElementById('order-details-modal');
    const modalBody = document.getElementById('modal-body-content');
    let itemsHtml = '<ul>';
    if (order.orderItems && order.orderItems.length > 0) {
        order.orderItems.forEach(item => {
            const itemName = item.menuItem ? item.menuItem.name : 'Item Not Found';
            const itemPrice = item.price ? item.price.toFixed(2) : 'N/A';
            itemsHtml += `<li>${itemName} - ${item.quantity} x ₹${itemPrice}</li>`;
        });
    } else {
        itemsHtml += '<li>No items found.</li>';
    }
    itemsHtml += '</ul>';
    modalBody.innerHTML = itemsHtml;
    modal.style.display = "block";
}

function closeModal() {
    const modal = document.getElementById('order-details-modal');
    modal.style.display = "none";
}

window.onclick = function(event) {
    const modal = document.getElementById('order-details-modal');
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

function logout() {
    sessionStorage.clear();
    window.location.href = '/';
}


// --- Add some basic CSS for status badges and action groups ---
const styleSheet = document.createElement("style");
styleSheet.innerText = `
.status-badge {
    padding: 3px 8px;
    border-radius: 12px;
    font-size: 0.8em;
    font-weight: 500;
    color: white;
}
.status-placed { background-color: #6c757d; }
.status-preparing { background-color: #ffc107; color: #333; }
.status-out-for-delivery { background-color: #17a2b8; }
.status-delivered { background-color: #28a745; }
.status-cancelled { background-color: #dc3545; }

.action-group { margin-bottom: 5px; }
.action-group select, .action-group button { margin-right: 5px; }
`;
document.head.appendChild(styleSheet);