document.addEventListener('DOMContentLoaded', () => {
    displayCartItems();

    const placeOrderBtn = document.getElementById('place-order-btn');
    if(placeOrderBtn) {
        placeOrderBtn.addEventListener('click', placeOrder);
    }

    // --- PUTHU LOGIC INGEY ---
    // Add event listener for the Continue Shopping button
    const continueShoppingBtn = document.getElementById('continue-shopping-btn');
    if (continueShoppingBtn) {
        continueShoppingBtn.addEventListener('click', continueShopping);
    }
    // --- MUDINJUTHU ---
});

function displayCartItems() {
    const cart = JSON.parse(sessionStorage.getItem('cart')) || [];
    const container = document.getElementById('cart-items-container');
    const totalPriceEl = document.getElementById('total-price');
    let totalPrice = 0;

    container.innerHTML = '';

    if (cart.length === 0) {
        container.innerHTML = '<p>Your cart is empty.</p>';
        totalPriceEl.textContent = '0.00';
        // Disable continue shopping if cart is empty
        const continueBtn = document.getElementById('continue-shopping-btn');
        if (continueBtn) continueBtn.disabled = true;
        return;
    }

    const table = document.createElement('table');
    table.style.width = '100%';
    table.innerHTML = `
        <thead>
            <tr>
                <th style="text-align: left;">Item</th>
                <th style="text-align: center;">Quantity</th>
                <th style="text-align: right;">Price</th>
                <th style="text-align: center;">Actions</th> </tr>
        </thead>
        <tbody></tbody>
    `;
    const tbody = table.querySelector('tbody');

    cart.forEach((item, index) => { // Added index to identify item for removal
        const itemTotal = item.price * item.quantity;
        totalPrice += itemTotal;
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.name}</td>
            <td style="text-align: center;">
                 <button onclick="updateQuantity(${index}, -1)" class="btn btn-small" style="padding: 2px 8px;">-</button>
                 <span style="margin: 0 5px;">${item.quantity}</span>
                 <button onclick="updateQuantity(${index}, 1)" class="btn btn-small" style="padding: 2px 8px;">+</button>
            </td>
            <td style="text-align: right;">₹${itemTotal.toFixed(2)}</td>
            <td style="text-align: center;"><button onclick="removeFromCart(${index})" class="btn btn-secondary" style="background-color: #dc3545; color: white; border: none; padding: 5px 10px;">Remove</button></td>
        `;
        tbody.appendChild(row);
    });

    container.appendChild(table);
    totalPriceEl.textContent = totalPrice.toFixed(2);
}

// --- PUTHU FUNCTIONS INGEY ---

function updateQuantity(index, change) {
    let cart = JSON.parse(sessionStorage.getItem('cart')) || [];
    if (cart[index]) {
        cart[index].quantity += change;
        if (cart[index].quantity <= 0) {
            // If quantity becomes 0 or less, remove the item
            cart.splice(index, 1);
        }
        sessionStorage.setItem('cart', JSON.stringify(cart));
        displayCartItems(); // Refresh the cart display
    }
}

function removeFromCart(index) {
    let cart = JSON.parse(sessionStorage.getItem('cart')) || [];
    cart.splice(index, 1); // Remove item at the specified index
    sessionStorage.setItem('cart', JSON.stringify(cart));
    displayCartItems(); // Refresh the cart display
}

function continueShopping() {
    const restaurantId = sessionStorage.getItem('cartRestaurantId');
    if (restaurantId) {
        // Go back to the menu page of the restaurant
        window.location.href = `menu.html?id=${restaurantId}`;
    } else {
        // If for some reason restaurantId is not stored, go to homepage
        window.location.href = '/';
    }
}
// --- MUDINJUTHU ---


function placeOrder() {
    const cart = JSON.parse(sessionStorage.getItem('cart')) || [];
    const restaurantId = sessionStorage.getItem('cartRestaurantId');
    const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));

    if (!loggedInUser) {
        alert('You must be logged in to place an order.');
        window.location.href = 'login.html'; 
        return;
    }
    
    if (cart.length === 0) {
        alert("Your cart is empty!");
        return;
    }

    const orderRequest = {
        userId: loggedInUser.id, 
        restaurantId: restaurantId,
        items: cart.map(item => ({
            menuItemId: item.id,
            quantity: item.quantity
        }))
    };

    fetch('/api/orders/place', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderRequest),
    })
    .then(response => {
        if (!response.ok) {
            return response.text().then(text => { throw new Error(text || 'Order placement failed') });
        }
        return response.json();
    })
    .then(order => {
        sessionStorage.removeItem('cart');
        sessionStorage.removeItem('cartRestaurantId');
        window.location.href = `order_confirmation.html?orderId=${order.id}`;
    })
    .catch(error => {
        console.error('Error placing order:', error);
        alert('There was a problem placing your order. Check the console for details.');
    });
}