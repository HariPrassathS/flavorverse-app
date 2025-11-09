document.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus();
    fetchRestaurants();
});

function checkLoginStatus() {
    const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));
    const navContainer = document.querySelector('.main-header nav');

    if (loggedInUser) {
        // If a user is logged in, show their name, navigation links, and logout button
        navContainer.innerHTML = `
            <span style="align-self: center; font-weight: 500;">Welcome, ${loggedInUser.username}!</span>
            <a href="my_orders.html" class="btn btn-secondary">My Orders</a>
            <a href="customer_profile.html" class="btn btn-secondary">My Profile</a>
            <a href="#" onclick="logout()" class="btn">Logout</a>
        `;
    } else {
        // If no user is logged in, show the login and sign up buttons
        navContainer.innerHTML = `
            <a href="login.html" class="btn btn-secondary">Login</a>
            <a href="register.html" class="btn">Sign Up</a>
        `;
    }
}

function logout() {
    sessionStorage.removeItem('loggedInUser');
    // Redirect to the homepage to refresh the header
    window.location.href = '/';
}


function fetchRestaurants() {
    fetch('/api/restaurants')
        .then(response => response.json())
        .then(restaurants => {
            displayRestaurants(restaurants);
        })
        .catch(error => {
            console.error('Error fetching restaurants:', error);
            const container = document.getElementById('restaurant-list-container');
            container.innerHTML = '<p>Could not load restaurants.</p>';
        });
}

function displayRestaurants(restaurants) {
    const container = document.getElementById('restaurant-list-container');
    container.innerHTML = ''; 

    if (!restaurants || restaurants.length === 0) {
        container.innerHTML = '<p>No restaurants found for your search.</p>';
        return;
    }

    restaurants.forEach(restaurant => {
        const card = document.createElement('div');
        card.className = 'restaurant-card';
        card.onclick = () => {
            window.location.href = `menu.html?id=${restaurant.id}`;
        };

        card.innerHTML = `
            <img src="${restaurant.imageUrl}" alt="${restaurant.name}">
            <div class="restaurant-card-content">
                <h3>${restaurant.name}</h3>
                <p>${restaurant.cuisineType}</p>
            </div>
        `;
        container.appendChild(card);
    });
}

function searchRestaurants() {
    const searchTerm = document.getElementById('search-bar').value;

    // If the search bar is empty, fetch all restaurants again
    if (searchTerm.trim() === '') {
        fetchRestaurants();
        return;
    }

    // Otherwise, call the search API
    fetch(`/api/restaurants/search?name=${searchTerm}`)
        .then(response => response.json())
        .then(restaurants => {
            displayRestaurants(restaurants);
        })
        .catch(error => {
            console.error('Error searching restaurants:', error);
            const container = document.getElementById('restaurant-list-container');
            container.innerHTML = '<p>Error while searching. Please try again.</p>';
        });
}