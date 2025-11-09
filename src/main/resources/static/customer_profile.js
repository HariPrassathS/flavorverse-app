/* === Customer Profile Management === */

document.addEventListener('DOMContentLoaded', () => {
    loadUserProfile();
});

// Get current user from sessionStorage (matching your app's auth system)
function getCurrentUser() {
    const userData = sessionStorage.getItem('loggedInUser');
    if (!userData) {
        alert('Please log in to view your profile');
        window.location.href = 'login.html';
        return null;
    }
    return JSON.parse(userData);
}

// Load user profile data
async function loadUserProfile() {
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
            showMessage('Error loading profile information', 'error');
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        showMessage('Error connecting to server', 'error');
    }
}

// Display profile information
function displayProfile(profile) {
    document.getElementById('display-fullName').textContent = profile.fullName || 'Not provided';
    document.getElementById('display-username').textContent = profile.username || 'Not provided';
    document.getElementById('display-phoneNo').textContent = profile.phoneNo || 'Not provided';
    document.getElementById('display-address').textContent = profile.address || 'Not provided';
    document.getElementById('display-role').textContent = formatRole(profile.role);
    
    // Store profile data for editing
    window.currentProfile = profile;
}

// Format role for display
function formatRole(role) {
    if (!role) return 'Customer';
    
    return role.replace('ROLE_', '').replace('_', ' ').toLowerCase()
              .replace(/\b\w/g, l => l.toUpperCase());
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
    document.getElementById('currentPassword').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
}

// Cancel edit and return to display
function cancelEdit() {
    document.getElementById('profile-display').style.display = 'block';
    document.getElementById('profile-edit').style.display = 'none';
    hideMessage();
}

// Update profile
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
        currentPassword: formData.get('currentPassword'),
        newPassword: formData.get('newPassword')
    };
    
    // Validate password confirmation if new password is provided
    const confirmPassword = formData.get('confirmPassword');
    if (updateData.newPassword) {
        if (!updateData.currentPassword) {
            showMessage('Please enter your current password to change it', 'error');
            return;
        }
        
        if (updateData.newPassword !== confirmPassword) {
            showMessage('New passwords do not match', 'error');
            return;
        }
        
        if (updateData.newPassword.length < 6) {
            showMessage('New password must be at least 6 characters long', 'error');
            return;
        }
    }
    
    // Remove password fields if not changing password
    if (!updateData.newPassword) {
        delete updateData.currentPassword;
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
            showMessage('Profile updated successfully!', 'success');
            
        } else {
            const errorText = await response.text();
            showMessage(errorText || 'Error updating profile', 'error');
        }
    } catch (error) {
        console.error('Error updating profile:', error);
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
    sessionStorage.removeItem('loggedInUser');
    window.location.href = 'login.html';
}