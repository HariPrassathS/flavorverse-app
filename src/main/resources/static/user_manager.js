/* === User Management JavaScript === */

document.addEventListener('DOMContentLoaded', () => {
    // Auto-populate forms with default values
    document.getElementById('customer-username').value = 'customer' + Math.floor(Math.random() * 1000);
    document.getElementById('customer-password').value = 'password123';
    document.getElementById('customer-fullname').value = 'Test Customer';
    
    document.getElementById('admin-username').value = 'admin' + Math.floor(Math.random() * 100);
    document.getElementById('admin-password').value = 'admin123';
    document.getElementById('admin-fullname').value = 'Test Administrator';
    
    document.getElementById('delivery-username').value = 'driver' + Math.floor(Math.random() * 100);
    document.getElementById('delivery-password').value = 'driver123';
    document.getElementById('delivery-fullname').value = 'Test Driver';
});

// Quick login function
async function quickLogin(username, password) {
    try {
        showMessage(`Attempting to login as ${username}...`, 'info');
        
        const response = await fetch('/api/users/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });

        if (response.ok) {
            const user = await response.json();
            sessionStorage.setItem('loggedInUser', JSON.stringify(user));
            
            showMessage(`Successfully logged in as ${user.username}!`, 'success');
            
            // Redirect based on role
            setTimeout(() => {
                if (user.role.includes('DELIVERY')) {
                    window.location.href = 'delivery_dashboard.html';
                } else if (user.role.includes('ADMIN')) {
                    window.location.href = 'admin_dashboard.html';
                } else {
                    window.location.href = 'index.html';
                }
            }, 2000);
            
        } else {
            const errorText = await response.text();
            showMessage(`Login failed: ${errorText}`, 'error');
        }
    } catch (error) {
        showMessage(`Error: ${error.message}`, 'error');
    }
}

// Create customer account
async function createCustomer(event) {
    event.preventDefault();
    
    const userData = {
        username: document.getElementById('customer-username').value,
        password: document.getElementById('customer-password').value,
        fullName: document.getElementById('customer-fullname').value,
        address: 'Test Address, Test City',
        phoneNo: '1234567890'
    };
    
    try {
        const response = await fetch('/api/users/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        
        if (response.ok) {
            const user = await response.json();
            showMessage(`Customer account created successfully! Username: ${userData.username}, Password: ${userData.password}`, 'success');
            
            // Auto-login after creation
            setTimeout(() => {
                quickLogin(userData.username, userData.password);
            }, 2000);
            
        } else {
            const errorText = await response.text();
            showMessage(`Failed to create customer: ${errorText}`, 'error');
        }
    } catch (error) {
        showMessage(`Error creating customer: ${error.message}`, 'error');
    }
}

// Create admin account (manually set role)
async function createAdmin(event) {
    event.preventDefault();
    
    const userData = {
        username: document.getElementById('admin-username').value,
        password: document.getElementById('admin-password').value,
        fullName: document.getElementById('admin-fullname').value,
        role: 'ROLE_SUPER_ADMIN'
    };
    
    try {
        // Use the debug endpoint to create admin user with proper role
        const response = await fetch('/api/debug/create-test-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        
        if (response.ok) {
            const user = await response.json();
            showMessage(`Admin account created successfully! Username: ${userData.username}, Password: ${userData.password}`, 'success');
            
            // Auto-login after creation
            setTimeout(() => {
                quickLogin(userData.username, userData.password);
            }, 2000);
            
        } else {
            const errorText = await response.text();
            showMessage(`Failed to create admin: ${errorText}`, 'error');
        }
    } catch (error) {
        showMessage(`Error creating admin: ${error.message}`, 'error');
    }
}

// Create delivery partner account
async function createDeliveryPartner(event) {
    event.preventDefault();
    
    const userData = {
        username: document.getElementById('delivery-username').value,
        password: document.getElementById('delivery-password').value,
        fullName: document.getElementById('delivery-fullname').value,
        role: 'ROLE_DELIVERY_PARTNER'
    };
    
    try {
        // Use debug endpoint for consistent user creation
        const response = await fetch('/api/debug/create-test-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        
        if (response.ok) {
            const user = await response.json();
            showMessage(`Delivery partner account created successfully! Username: ${userData.username}, Password: ${userData.password}`, 'success');
            
            // Auto-login after creation
            setTimeout(() => {
                quickLogin(userData.username, userData.password);
            }, 2000);
            
        } else {
            const errorText = await response.text();
            showMessage(`Failed to create delivery partner: ${errorText}`, 'error');
        }
    } catch (error) {
        showMessage(`Error creating delivery partner: ${error.message}`, 'error');
    }
}

// Show message function
function showMessage(text, type = 'info') {
    const messageContainer = document.getElementById('message-container');
    const messageText = document.getElementById('message-text');
    
    messageText.textContent = text;
    messageContainer.className = `message-container ${type}`;
    messageContainer.style.display = 'block';
    
    // Auto hide after 5 seconds for info messages
    if (type !== 'success') {
        setTimeout(() => {
            hideMessage();
        }, 5000);
    }
}

// Hide message function
function hideMessage() {
    const messageContainer = document.getElementById('message-container');
    messageContainer.style.display = 'none';
}

// Check if already logged in
window.addEventListener('load', () => {
    const currentUser = sessionStorage.getItem('loggedInUser');
    if (currentUser) {
        const user = JSON.parse(currentUser);
        showMessage(`Currently logged in as: ${user.username} (${user.role})`, 'info');
    }
});