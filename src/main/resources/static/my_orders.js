document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));
    if (!loggedInUser) {
        // Use toast for error
        Toastify({ text: "Please login to see your orders.", duration: 3000, gravity: "bottom", position: "right", style: { background: "linear-gradient(to right, #ff5f6d, #ffc371)" }}).showToast();
        // Redirect after delay
        setTimeout(() => { window.location.href = 'login.html'; }, 2000);
        return;
    }
    fetchUserOrders(loggedInUser.id);

    // Review modal logic
    const reviewForm = document.getElementById('review-form');
    reviewForm.addEventListener('submit', handleReviewSubmit);

    const stars = document.querySelectorAll('.star-rating .star');
    stars.forEach(star => {
        star.addEventListener('click', () => setRating(star.dataset.value));
        star.addEventListener('mouseover', () => highlightStars(star.dataset.value));
        star.addEventListener('mouseout', () => highlightStars(document.getElementById('rating-value').value));
    });
});

let allUserOrders = [];

function fetchUserOrders(userId) {
    fetch(`/api/orders/user/${userId}`)
        .then(response => response.ok ? response.json() : Promise.reject('Failed to load orders'))
        .then(orders => {
            allUserOrders = orders;
            displayMyOrders(orders);
        })
        .catch(error => { // Added error handling for fetch
             console.error('Error fetching orders:', error);
             Toastify({ text: `Error: ${error}`, duration: 3000, gravity: "bottom", position: "right", style: { background: "linear-gradient(to right, #ff5f6d, #ffc371)" }}).showToast();
             document.getElementById('orders-list-container').innerHTML = "<p>Could not load your orders.</p>";
        });
}

function displayMyOrders(orders) {
    const container = document.getElementById('orders-list-container');
    container.innerHTML = '';
    if (orders.length === 0) {
        container.innerHTML = "<p>You haven't placed any orders yet.</p>";
        return;
    }
    orders.forEach(order => {
        const orderCard = document.createElement('div');
        orderCard.className = 'card';
        orderCard.style.marginBottom = '20px';
        orderCard.style.padding = '20px';
        const orderDate = new Date(order.orderDate).toLocaleString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit' });

        // === CANCEL BUTTON LOGIC AH INGA MERGE PANROM ===
        let actionButtons = `<button class="btn btn-small" onclick="showOrderDetails(${order.id})">Details</button>`;
        const statusUpper = order.status.toUpperCase();

        if (statusUpper === 'OUT FOR DELIVERY' || statusUpper === 'PICKED UP') {
            actionButtons += ` <button class="btn btn-small" onclick="window.location.href='track_order.html?orderId=${order.id}'">Track Order</button>`;
        } else if (statusUpper === 'DELIVERED') {
            actionButtons += ` <button class="btn btn-small" onclick="openReviewModal(${order.restaurant.id}, '${order.restaurant.name}')">Leave a Review</button>`;
        } else if (statusUpper === 'PLACED' || statusUpper === 'PREPARING') {
            // "PLACED" or "PREPARING" na, cancel button ah yum, track button ah yum kaatrom
             actionButtons += ` <button class="btn btn-small" onclick="window.location.href='track_order.html?orderId=${order.id}'">Track Order</button>`;
             actionButtons += ` <button class="btn btn-small btn-danger" onclick="cancelOrder(${order.id}, this)">Cancel Order</button>`;
        }
        // =================================================

        orderCard.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
                <div><h3 style="margin-bottom: 5px;">${order.restaurant?.name || 'Restaurant'}</h3><p style="font-size: 0.9em; color: #666;">Order ID: #${order.id}</p></div>
                <div><p><strong>Total: ₹${order.totalPrice.toFixed(2)}</strong></p><p style="text-align: right; font-size: 0.9em; color: #666;">On ${orderDate}</p></div>
            </div>
            <hr style="margin: 15px 0;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                 <p><strong>Status:</strong> <span class="status-badge status-${order.status.toLowerCase()}">${order.status}</span></p>
                 <div class="order-card-actions">${actionButtons}</div> <!-- CSS class add pannirukken -->
            </div>
        `;
        container.appendChild(orderCard);
    });
}

function showOrderDetails(orderId) {
    const order = allUserOrders.find(o => o.id === orderId);
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
    document.getElementById('order-details-modal').style.display = "none";
}

// --- Review Modal Functions ---

function openReviewModal(restaurantId, restaurantName) {
    document.getElementById('review-restaurant-id').value = restaurantId;
    document.getElementById('review-modal-title').innerText = `Leave a Review for ${restaurantName}`;
    document.getElementById('review-modal').style.display = 'block';
}

function closeReviewModal() {
    document.getElementById('review-modal').style.display = 'none';
    document.getElementById('review-form').reset();
    setRating(0); // Reset stars
}

function setRating(value) {
    document.getElementById('rating-value').value = value;
    highlightStars(value);
}

function highlightStars(value) {
    const stars = document.querySelectorAll('.star-rating .star');
    stars.forEach(star => {
        star.classList.toggle('selected', star.dataset.value <= value);
    });
}

// --- Review Submit Function ---
function handleReviewSubmit(event) {
    event.preventDefault();
    const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));

    const reviewData = {
        userId: loggedInUser.id,
        restaurantId: document.getElementById('review-restaurant-id').value,
        rating: document.getElementById('rating-value').value,
        comment: document.getElementById('comment').value
    };

    if (!reviewData.rating || reviewData.rating == 0) {
        Toastify({ text: "Please select a star rating.", duration: 3000, gravity: "top", position: "right", style: { background: "linear-gradient(to right, #ff5f6d, #ffc371)" }}).showToast();
        return;
    }

    fetch('/api/reviews/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewData)
    })
    .then(response => {
        if (!response.ok) {
           return response.text().then(text => { throw new Error(text || 'Failed to submit review') });
        }
        return response.json();
    })
    .then(data => {
        Toastify({ text: "Thank you for your review!", duration: 3000, gravity: "top", position: "right", style: { background: "linear-gradient(to right, #00b09b, #96c93d)" }}).showToast();
        closeReviewModal();
    })
    .catch(error => {
        console.error("Review submission error:", error);
        Toastify({ text: `Error: ${error.message}`, duration: 3000, gravity: "top", position: "right", style: { background: "linear-gradient(to right, #ff5f6d, #ffc371)" }}).showToast();
    });
}

// === IDHU THAAN PUTHU "CANCEL ORDER" FUNCTION ===
async function cancelOrder(orderId, buttonElement) {
    // User kitta confirmation kekkurom
    if (!confirm('Are you sure you want to cancel this order? This action cannot be undone.')) {
        return;
    }

    // Button ah disable pannidalam
    buttonElement.disabled = true;
    buttonElement.textContent = 'Cancelling...';

    try {
        const response = await fetch(`/api/orders/cancel/${orderId}`, {
            method: 'PUT'
        });

        if (!response.ok) {
            // Error aana, error message ah vaangi kaatuvom
            const errorText = await response.text();
            throw new Error(errorText || 'Failed to cancel order.');
        }

        // Success! (Unga file la irukura madhiri Toastify use panrom)
        Toastify({
            text: 'Order #' + orderId + ' has been cancelled.',
            duration: 3000,
            gravity: "top", // Unga review form kooda match panna
            position: "right", // Unga review form kooda match panna
            style: { background: "linear-gradient(to right, #00b09b, #96c93d)" } // Unga success color
        }).showToast();

        // Page ah refresh panna vendam,
        // order list ah mattum thirumba fetch pannidalam
        // *** UNGA FILE la 'fetchUserOrders' nu irukku, adha call panrom ***
        const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));
        if (loggedInUser) {
            fetchUserOrders(loggedInUser.id);
        }

    } catch (error) {
        console.error('Error cancelling order:', error);
        // Error message ah user kitta kaatuvom (Toastify use panni)
        Toastify({ 
            text: `Error: ${error.message}`, 
            duration: 3000, 
            gravity: "top", // Unga review form kooda match panna
            position: "right", // Unga review form kooda match panna
            style: { background: "linear-gradient(to right, #ff5f6d, #ffc371)" } // Unga error color
        }).showToast();
        
        // Button ah thirumba enable pannidalam
        buttonElement.disabled = false;
        buttonElement.textContent = 'Cancel Order';
    }
}


// Close modals if user clicks outside of them
window.onclick = function(event) {
    const detailsModal = document.getElementById('order-details-modal');
    const reviewModal = document.getElementById('review-modal');
    if (event.target == detailsModal) {
        detailsModal.style.display = "none";
    }
    if (event.target == reviewModal) {
        // Ippadi pannadha nalladhu, user type pannum bodhu close aagidadhu
        // closeReviewModal();
    }
}

