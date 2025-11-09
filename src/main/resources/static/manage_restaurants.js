document.addEventListener('DOMContentLoaded', () => {
    loadRestaurants();

    const form = document.getElementById('restaurant-form');
    form.addEventListener('submit', handleFormSubmit);
});

function loadRestaurants() {
    fetch('/api/restaurants')
        .then(response => response.json())
        .then(data => displayRestaurantTable(data))
        .catch(error => { // Add error handling for initial load
             console.error('Error loading restaurants:', error);
             Toastify({ text: `Failed to load restaurants: ${error.message}`, duration: 3000, gravity: "bottom", position: "right", style: { background: "linear-gradient(to right, #ff5f6d, #ffc371)" }}).showToast();
        });
}

function displayRestaurantTable(restaurants) {
    const container = document.getElementById('restaurant-table-container');
    container.innerHTML = '';
    const table = document.createElement('table');

    table.innerHTML = `
        <thead>
            <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Address</th>
                <th>Cuisine</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody></tbody>
    `;
    const tbody = table.querySelector('tbody');

    restaurants.forEach(r => {
        const row = document.createElement('tr');
        const imageUrl = r.imageUrl || 'https://via.placeholder.com/100x50.png?text=No+Image';

        row.innerHTML = `
            <td>
                <img src="${imageUrl}" alt="${r.name}" style="width: 60px; height: 40px; object-fit: cover; border-radius: 5px;">
            </td>
            <td>${r.name}</td>
            <td>${r.address}</td>
            <td>${r.cuisineType}</td>
            <td class="action-cell">
                <button class="btn btn-small" onclick="window.location.href='manage_menu.html?id=${r.id}'">Manage Menu</button>
                <button class="btn btn-small" onclick="editRestaurant(${r.id}, '${r.name}', '${r.address}', '${r.cuisineType}', '${r.imageUrl || ''}')">Edit</button>
                <button class="btn btn-small" onclick="deleteRestaurant(${r.id})">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
    container.appendChild(table);
}

// --- UPDATE PANNA FUNCTION (handleFormSubmit) ---
function handleFormSubmit(event) {
    event.preventDefault();
    const id = document.getElementById('restaurantId').value;
    const restaurant = {
        name: document.getElementById('name').value,
        address: document.getElementById('address').value,
        cuisineType: document.getElementById('cuisineType').value,
        imageUrl: document.getElementById('imageUrl').value,
    };

    const isUpdate = !!id;
    const url = isUpdate ? `/api/restaurants/update/${id}` : '/api/restaurants/add';
    const method = isUpdate ? 'PUT' : 'POST';

    fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(restaurant)
    })
    .then(response => {
         if (!response.ok) {
            return response.text().then(text => { throw new Error(text || 'Save failed') });
        }
        return response.json(); // Or just response.ok if no body is returned
    })
    .then(() => {
        // Show success toast
        Toastify({ text: `Restaurant ${isUpdate ? 'updated' : 'added'} successfully!`, duration: 3000, gravity: "top", position: "right", style: { background: "linear-gradient(to right, #00b09b, #96c93d)" }}).showToast();
        // Reset form and reload list after a short delay
        document.getElementById('restaurant-form').reset();
        document.getElementById('restaurantId').value = ''; // Clear ID
        document.getElementById('form-title').innerText = 'Add New Restaurant';
        setTimeout(loadRestaurants, 500); // Reload list slightly later
    })
    .catch(error => {
        console.error('Error saving restaurant:', error);
        // Show error toast
        Toastify({ text: `Failed to save restaurant: ${error.message}`, duration: 3000, gravity: "top", position: "right", style: { background: "linear-gradient(to right, #ff5f6d, #ffc371)" }}).showToast();
    });
}

function editRestaurant(id, name, address, cuisineType, imageUrl) {
    document.getElementById('form-title').innerText = 'Edit Restaurant';
    document.getElementById('restaurantId').value = id;
    document.getElementById('name').value = name;
    document.getElementById('address').value = address;
    document.getElementById('cuisineType').value = cuisineType;
    document.getElementById('imageUrl').value = imageUrl;
    window.scrollTo(0, 0);
}

// --- UPDATE PANNA FUNCTION (deleteRestaurant) ---
function deleteRestaurant(id) {
    // Confirm box appadiye irukatum
    if (confirm('Are you sure you want to delete this restaurant?')) {
        fetch(`/api/restaurants/delete/${id}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (!response.ok) {
                 return response.text().then(text => { throw new Error(text || 'Delete failed') });
            }
            // Show success toast
            Toastify({ text: 'Restaurant deleted successfully!', duration: 3000, gravity: "top", position: "right", style: { background: "linear-gradient(to right, #00b09b, #96c93d)" }}).showToast();
            // Reload list
            loadRestaurants();
        })
        .catch(error => {
             console.error('Error deleting restaurant:', error);
            // Show error toast
            Toastify({ text: `Failed to delete restaurant: ${error.message}`, duration: 3000, gravity: "top", position: "right", style: { background: "linear-gradient(to right, #ff5f6d, #ffc371)" }}).showToast();
        });
    }
}

function logout() {
    sessionStorage.clear();
    window.location.href = '/';
}