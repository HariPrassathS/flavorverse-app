// --- Global variable for our partner ID ---
let deliveryPartnerId = null;

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. Login Check ---
    const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));
    if (!loggedInUser || loggedInUser.role !== 'ROLE_DELIVERY_PARTNER') {
        Toastify({ text: 'You must be logged in as a delivery partner.', duration: 3000, gravity: "bottom", position: "right", style: { background: "linear-gradient(to right, #ff5f6d, #ffc371)" }}).showToast();
        setTimeout(() => { window.location.href = '/delivery_login.html'; }, 2000);
        return;
    }

    // --- 2. Partner Profile Fetch ---
    fetch(`/api/delivery/me/${loggedInUser.id}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Could not find your delivery partner profile.');
            }
            return response.json();
        })
        .then(partner => {
            // --- 3. Partner ID Kedaichathum Ellathayum Start Pannu ---
            deliveryPartnerId = partner.id;
            if (loggedInUser.fullName) {
                document.getElementById('welcome-message').textContent = `Welcome, ${loggedInUser.fullName}!`;
            } else {
                 document.getElementById('welcome-message').textContent = `Welcome, ${loggedInUser.username}!`;
            }

            // 4. Start GPS Tracking
            startGpsTracking();

            // 5. Fetch assigned orders MUTHALLA oru thadava
            fetchMyOrders();

            // Ovvoru 15 second-kum puthu orders-kaga check pannu
            setInterval(fetchMyOrders, 15000);
        })
        .catch(error => {
            console.error(error);
            Toastify({ text: `Error: ${error.message}`, duration: 3000, gravity: "bottom", position: "right", style: { background: "linear-gradient(to right, #ff5f6d, #ffc371)" }}).showToast();
            logout();
        });
});

// 1. GPS TRACKING FUNCTION (No changes)
function startGpsTracking() {
    if (!navigator.geolocation) {
        Toastify({ text: "Browser doesn't support GPS tracking.", duration: 3000, gravity: "bottom", position: "right", style: { background: "linear-gradient(to right, #ff5f6d, #ffc371)" }}).showToast();
        document.getElementById('status-message').textContent = "GPS NOT SUPPORTED";
        return;
    }
    navigator.geolocation.watchPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            document.getElementById('coords').textContent = `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`;
            if (deliveryPartnerId) {
                sendLocationToBackend(deliveryPartnerId, latitude, longitude);
            }
        },
        (error) => {
            console.error("Error getting GPS location:", error);
            document.getElementById('coords').textContent = `Error: ${error.message}`;
            Toastify({ text: `GPS Error: ${error.message}`, duration: 3000, gravity: "bottom", position: "right", style: { background: "linear-gradient(to right, #ff5f6d, #ffc371)" }}).showToast();
        },
        { enableHighAccuracy: true }
    );
}

function sendLocationToBackend(partnerId, lat, lng) {
    fetch(`/api/delivery/update-location/${partnerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude: lat, longitude: lng })
    }).catch(error => console.error("Network error while updating location:", error));
}


// 2. ORDER FETCHING FUNCTIONS (No changes)
function fetchMyOrders() {
    if (!deliveryPartnerId) return;

    fetch(`/api/delivery/my-orders/${deliveryPartnerId}`)
        .then(response => response.ok ? response.json() : Promise.reject('Failed to load orders'))
        .then(orders => {
            displayOrders(orders);
        })
        .catch(error => {
            console.error("Error fetching my orders:", error);
             Toastify({ text: `Error fetching orders: ${error}`, duration: 3000, gravity: "bottom", position: "right", style: { background: "linear-gradient(to right, #ff5f6d, #ffc371)" }}).showToast();
        });
}

function displayOrders(orders) {
    const container = document.getElementById('active-orders');

    if (orders.length === 0) {
        container.innerHTML = "<p>No active orders assigned to you.</p>";
        return;
    }

    container.innerHTML = '';

    orders.forEach(order => {
        const orderCard = document.createElement('div');
        orderCard.className = 'card';
        orderCard.style.padding = '20px';
        orderCard.style.marginBottom = '15px';

        let buttonsHtml = '';

        if (order.orderStatus === 'OUT FOR DELIVERY') {
            buttonsHtml = `<button class="btn" onclick="pickupOrder(${order.orderId})">Mark as Picked Up</button>`;
        } else if (order.orderStatus === 'PICKED UP') {
            buttonsHtml = `<button class="btn" onclick="deliveredOrder(${order.orderId})">Mark as Delivered</button>`;
        }

        orderCard.innerHTML = `
            <h3>Order #${order.orderId} (Status: ${order.orderStatus})</h3>
            <hr style="margin: 10px 0;">
            <p><strong>Pickup From:</strong> ${order.restaurantName || 'Restaurant'}</p>
            <p><small>${order.restaurantAddress || 'Address not available'}</small></p>
            <br>
            <p><strong>Deliver To:</strong> ${order.customerName || 'Customer'}</p>
            <p><small>${order.customerAddress || 'Address not available'}</small></p>
            <div style="margin-top: 15px; text-align: right;">
                ${buttonsHtml}
            </div>
        `;
        container.appendChild(orderCard);
    });
}

// --- 3. API CALL FUNCTIONS (Updated - Removed confirm()) ---
function pickupOrder(orderId) {
    // REMOVED: if (!confirm("Are you sure you have picked up this order?")) return;

    fetch(`/api/delivery/pickup/${orderId}`, { method: 'PUT' })
        .then(response => {
             if (!response.ok) {
                return response.text().then(text => { throw new Error(text || 'Update failed') });
            }
            return response.json();
        })
        .then(data => {
            Toastify({ text: "Order marked as PICKED UP.", duration: 3000, gravity: "top", position: "right", style: { background: "linear-gradient(to right, #00b09b, #96c93d)" }}).showToast();
            fetchMyOrders();
        })
        .catch(error => {
             Toastify({ text: `Failed to update status: ${error.message}`, duration: 3000, gravity: "top", position: "right", style: { background: "linear-gradient(to right, #ff5f6d, #ffc371)" }}).showToast();
        });
}

function deliveredOrder(orderId) {
    // REMOVED: if (!confirm("Are you sure you have delivered this order?")) return;

    fetch(`/api/delivery/delivered/${orderId}`, { method: 'PUT' })
         .then(response => {
             if (!response.ok) {
                return response.text().then(text => { throw new Error(text || 'Update failed') });
            }
            return response.json();
        })
        .then(data => {
            Toastify({ text: "Order marked as DELIVERED. Well done!", duration: 3000, gravity: "top", position: "right", style: { background: "linear-gradient(to right, #00b09b, #96c93d)" }}).showToast();
            fetchMyOrders();
        })
        .catch(error => {
             Toastify({ text: `Failed to update status: ${error.message}`, duration: 3000, gravity: "top", position: "right", style: { background: "linear-gradient(to right, #ff5f6d, #ffc371)" }}).showToast();
        });
}

function logout() {
    sessionStorage.removeItem('loggedInUser');
    window.location.href = '/delivery_login.html';
}