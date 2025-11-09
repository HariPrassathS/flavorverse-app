document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const restaurantId = params.get('id');

    if (!restaurantId) {
        document.querySelector('main').innerHTML = '<h1>No restaurant selected.</h1>';
         // Show error toast if no ID
        Toastify({ text: 'No restaurant ID provided.', duration: 3000, gravity: "bottom", position: "right", style: { background: "linear-gradient(to right, #ff5f6d, #ffc371)" }}).showToast();
        return;
    }

    fetchRestaurantName(restaurantId);
    loadMenuItems(restaurantId);

    const form = document.getElementById('menu-item-form');
    form.addEventListener('submit', (event) => handleFormSubmit(event, restaurantId));
});

function fetchRestaurantName(id) {
    fetch(`/api/restaurants/${id}`)
        .then(response => response.ok ? response.json() : Promise.reject('Failed to load restaurant name'))
        .then(restaurant => {
            document.getElementById('restaurant-name-title').innerText = `Manage Menu for ${restaurant.name}`;
        })
        .catch(error => {
            console.error('Error fetching restaurant name:', error);
            Toastify({ text: `Error: ${error}`, duration: 3000, gravity: "bottom", position: "right", style: { background: "linear-gradient(to right, #ff5f6d, #ffc371)" }}).showToast();
        });
}

function loadMenuItems(restaurantId) {
    fetch(`/api/menu/${restaurantId}`)
        .then(response => response.ok ? response.json() : Promise.reject('Failed to load menu items'))
        .then(data => displayMenuTable(data, restaurantId))
         .catch(error => { // Add error handling for load
             console.error('Error loading menu:', error);
             Toastify({ text: `Failed to load menu: ${error}`, duration: 3000, gravity: "bottom", position: "right", style: { background: "linear-gradient(to right, #ff5f6d, #ffc371)" }}).showToast();
             document.getElementById('menu-table-container').innerHTML = '<p>Could not load menu items.</p>';
        });
}

function displayMenuTable(menuItems, restaurantId) {
    const container = document.getElementById('menu-table-container');
    container.innerHTML = '';
    const table = document.createElement('table');

    table.innerHTML = `
        <thead>
            <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Price</th>
                <th>Description</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody></tbody>
    `;
    const tbody = table.querySelector('tbody');

    menuItems.forEach(item => {
        const row = document.createElement('tr');
        const imageUrl = item.imageUrl || 'https://via.placeholder.com/100x50.png?text=No+Image';

        row.innerHTML = `
            <td>
                <img src="${imageUrl}" alt="${item.name}" style="width: 60px; height: 40px; object-fit: cover; border-radius: 5px;">
            </td>
            <td>${item.name}</td>
            <td>₹${item.price.toFixed(2)}</td>
            <td>${item.description}</td>
            <td class="action-cell">
                <button class="btn btn-small" onclick="editItem('${item.id}', '${item.name}', '${item.price}', '${item.description}', '${item.imageUrl || ''}')">Edit</button>
                <button class="btn btn-small" onclick="deleteItem(${item.id}, ${restaurantId})">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
    container.appendChild(table);
}

// --- UPDATE PANNA FUNCTION (handleFormSubmit) ---
function handleFormSubmit(event, restaurantId) {
    event.preventDefault();
    const itemId = document.getElementById('itemId').value;
    const item = {
        name: document.getElementById('name').value,
        price: document.getElementById('price').value,
        description: document.getElementById('description').value,
        imageUrl: document.getElementById('imageUrl').value
    };

    const isUpdate = !!itemId;
    const url = isUpdate ? `/api/menu/update/${itemId}` : `/api/menu/add/${restaurantId}`;
    const method = isUpdate ? 'PUT' : 'POST';

    fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
    })
     .then(response => {
         if (!response.ok) {
            return response.text().then(text => { throw new Error(text || 'Save failed') });
        }
        return response.json(); // Or just response.ok
    })
    .then(() => {
        // Show success toast
        Toastify({ text: `Menu item ${isUpdate ? 'updated' : 'added'} successfully!`, duration: 3000, gravity: "top", position: "right", style: { background: "linear-gradient(to right, #00b09b, #96c93d)" }}).showToast();
        // Reset form and reload list
        document.getElementById('menu-item-form').reset();
        document.getElementById('itemId').value = '';
        document.getElementById('form-title').innerText = 'Add New Item';
        loadMenuItems(restaurantId); // Just reload the table
    })
    .catch(error => {
        console.error('Error saving menu item:', error);
        // Show error toast
        Toastify({ text: `Failed to save item: ${error.message}`, duration: 3000, gravity: "top", position: "right", style: { background: "linear-gradient(to right, #ff5f6d, #ffc371)" }}).showToast();
    });
}

function editItem(id, name, price, description, imageUrl) {
    document.getElementById('form-title').innerText = 'Edit Menu Item';
    document.getElementById('itemId').value = id;
    document.getElementById('name').value = name;
    document.getElementById('price').value = price;
    document.getElementById('description').value = description;
    document.getElementById('imageUrl').value = imageUrl;
    window.scrollTo(0, 0);
}

// --- UPDATE PANNA FUNCTION (deleteItem) ---
function deleteItem(itemId, restaurantId) {
    // Confirm box appadiye irukatum
    if (confirm('Are you sure you want to delete this menu item?')) {
        fetch(`/api/menu/delete/${itemId}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (!response.ok) {
                 return response.text().then(text => { throw new Error(text || 'Delete failed') });
            }
             // Show success toast
            Toastify({ text: 'Menu item deleted successfully!', duration: 3000, gravity: "top", position: "right", style: { background: "linear-gradient(to right, #00b09b, #96c93d)" }}).showToast();
            // Reload list
            loadMenuItems(restaurantId);
        })
         .catch(error => {
             console.error('Error deleting menu item:', error);
            // Show error toast
            Toastify({ text: `Failed to delete item: ${error.message}`, duration: 3000, gravity: "top", position: "right", style: { background: "linear-gradient(to right, #ff5f6d, #ffc371)" }}).showToast();
        });
    }
}