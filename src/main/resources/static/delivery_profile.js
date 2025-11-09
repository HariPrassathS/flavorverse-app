/* === Delivery Partner Profile Management === */

let isOnline = false;
let currentLocation = { lat: 0, lng: 0 };

document.addEventListener('DOMContentLoaded', () => {
    loadDeliveryProfile();
    checkDeliveryAccess();
    startLocationTracking();
});

// Check if user has delivery partner access
function checkDeliveryAccess() {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    if (!currentUser.role || !currentUser.role.includes('DELIVERY_PARTNER')) {
        alert('Access denied. Delivery partner privileges required.');
        window.location.href = 'delivery_login.html';
        return;
    }
}

// Get current user from sessionStorage (matching your app's auth system)
function getCurrentUser() {
    const userData = sessionStorage.getItem('loggedInUser');
    if (!userData) {
        alert('Please log in to access delivery features');
        window.location.href = 'delivery_login.html';
        return null;
    }
    return JSON.parse(userData);
}

// Load delivery partner profile data
async function loadDeliveryProfile() {
    const currentUser = getCurrentUser();
    if (!currentUser) return;

    try {
        const response = await fetch(`/api/users/profile/${currentUser.id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const profile = await response.json();
            displayProfile(profile);
        } else {
            showMessage('Error loading delivery partner profile', 'error');
        }
    } catch (error) {
        console.error('Error loading delivery profile:', error);
        showMessage('Error connecting to server', 'error');
    }
}

// Display profile information
function displayProfile(profile) {
    document.getElementById('display-fullName').textContent = profile.fullName || 'Delivery Partner';
    document.getElementById('display-username').textContent = profile.username || 'Not provided';
    document.getElementById('display-phoneNo').textContent = profile.phoneNo || 'Not provided';
    document.getElementById('display-address').textContent = profile.address || 'Not provided';
    
    // Store profile data for editing
    window.currentProfile = profile;
}

// Start location tracking
function startLocationTracking() {
    if (navigator.geolocation) {
        // Get initial location
        getCurrentLocation();
        
        // Update location every 15 seconds
        setInterval(() => {
            if (isOnline) {
                getCurrentLocation();
            }
        }, 15000);
    } else {
        showMessage('Geolocation is not supported by this browser', 'error');
    }
}

// Get current GPS location
function getCurrentLocation() {
    navigator.geolocation.getCurrentPosition(
        (position) => {
            currentLocation.lat = position.coords.latitude;
            currentLocation.lng = position.coords.longitude;
            
            updateLocationDisplay();
            
            // Send location to server if online
            if (isOnline) {
                updateLocationOnServer();
            }
        },
        (error) => {
            console.error('Error getting location:', error);
            document.getElementById('display-location').textContent = 'Location unavailable';
        }
    );
}

// Update location display
function updateLocationDisplay() {
    const locationText = `${currentLocation.lat.toFixed(6)}, ${currentLocation.lng.toFixed(6)}`;
    document.getElementById('display-location').textContent = locationText;
    
    // Update modal info
    document.getElementById('current-lat').textContent = currentLocation.lat.toFixed(6);
    document.getElementById('current-lng').textContent = currentLocation.lng.toFixed(6);
}

// Update location on server
async function updateLocationOnServer() {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    try {
        const response = await fetch(`/api/delivery/update-location/${currentUser.id}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                latitude: currentLocation.lat,
                longitude: currentLocation.lng,
                available: isOnline
            })
        });
        
        if (!response.ok) {
            console.error('Failed to update location on server');
        }
    } catch (error) {
        console.error('Error updating location:', error);
    }
}

// Toggle availability status
async function toggleAvailability() {
    isOnline = !isOnline;
    
    const statusElement = document.getElementById('availability-status');
    const buttonElement = document.getElementById('availability-btn');
    
    if (isOnline) {
        statusElement.textContent = '🟢 Online';
        statusElement.className = 'status-indicator online';
        buttonElement.textContent = 'Go Offline';
        buttonElement.className = 'btn btn-danger';
        
        // Start location updates
        getCurrentLocation();
        showMessage('You are now online and available for deliveries!', 'success');
    } else {
        statusElement.textContent = '🔴 Offline';
        statusElement.className = 'status-indicator offline';
        buttonElement.textContent = 'Go Online';
        buttonElement.className = 'btn btn-success';
        
        showMessage('You are now offline. No new orders will be assigned.', 'info');
    }
    
    // Update server with availability status
    updateLocationOnServer();
}

// Show edit form
function showEditForm() {
    if (!window.currentProfile) return;
    
    // Hide display, show edit form
    document.getElementById('profile-display').style.display = 'none';
    document.getElementById('profile-edit').style.display = 'block';
    
    // Populate form with current data
    document.getElementById('fullName').value = window.currentProfile.fullName || '';
    document.getElementById('phoneNo').value = window.currentProfile.phoneNo || '';
    document.getElementById('address').value = window.currentProfile.address || '';
    
    // Clear password fields
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
}

// Cancel edit and return to display
function cancelEdit() {
    document.getElementById('profile-display').style.display = 'block';
    document.getElementById('profile-edit').style.display = 'none';
    hideMessage();
}

// Show location information modal
function showLocationInfo() {
    updateLocationDisplay();
    document.getElementById('location-info-modal').style.display = 'block';
}

// Close location information modal
function closeLocationInfo() {
    document.getElementById('location-info-modal').style.display = 'none';
}

// Update location immediately
function updateLocationNow() {
    getCurrentLocation();
    showMessage('Location updated successfully!', 'success');
}

// Update delivery profile
async function updateProfile(event) {
    event.preventDefault();
    
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    // Get form data
    const formData = new FormData(event.target);
    const updateData = {
        fullName: formData.get('fullName'),
        phoneNo: formData.get('phoneNo'),
        address: formData.get('address'),
        newPassword: formData.get('newPassword')
    };
    
    // Validate password confirmation if new password is provided
    const confirmPassword = formData.get('confirmPassword');
    if (updateData.newPassword) {
        if (updateData.newPassword !== confirmPassword) {
            showMessage('New passwords do not match', 'error');
            return;
        }
        
        if (updateData.newPassword.length < 6) {
            showMessage('New password must be at least 6 characters long', 'error');
            return;
        }
    } else {
        delete updateData.newPassword;
    }
    
    try {
        const response = await fetch(`/api/users/profile/${currentUser.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
        });
        
        if (response.ok) {
            const updatedProfile = await response.json();
            
            // Update stored user data (use sessionStorage to match your app)
            const updatedUser = { ...currentUser };
            updatedUser.fullName = updatedProfile.fullName;
            updatedUser.phoneNo = updatedProfile.phoneNo;
            updatedUser.address = updatedProfile.address;
            sessionStorage.setItem('loggedInUser', JSON.stringify(updatedUser));
            
            // Refresh display
            displayProfile(updatedProfile);
            cancelEdit();
            showMessage('Delivery partner profile updated successfully!', 'success');
            
        } else {
            const errorText = await response.text();
            showMessage(errorText || 'Error updating delivery profile', 'error');
        }
    } catch (error) {
        console.error('Error updating delivery profile:', error);
        showMessage('Error connecting to server', 'error');
    }
}

// Show message to user
function showMessage(text, type = 'info') {
    const messageContainer = document.getElementById('message-container');
    const messageText = document.getElementById('message-text');
    
    messageText.textContent = text;
    messageContainer.className = `message-container ${type}`;
    messageContainer.style.display = 'block';
    
    // Auto hide after 5 seconds
    setTimeout(() => {
        hideMessage();
    }, 5000);
}

// Hide message
function hideMessage() {
    const messageContainer = document.getElementById('message-container');
    messageContainer.style.display = 'none';
}

// Logout function
function logout() {
    if (isOnline) {
        if (!confirm('You are currently online. Logging out will set you offline. Continue?')) {
            return;
        }
        isOnline = false;
        updateLocationOnServer();
    }
    
    localStorage.removeItem('currentUser');
    sessionStorage.removeItem('loggedInUser');
    window.location.href = 'delivery_login.html';
}

// Close modal when clicking outside of it
window.onclick = function(event) {
    const modal = document.getElementById('location-info-modal');
    if (event.target == modal) {
        closeLocationInfo();
    }
}