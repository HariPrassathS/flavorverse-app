// Delivery Partner Registration JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Remove loader when page is fully loaded
    setTimeout(function() {
        const loader = document.querySelector('.loader-wrapper');
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => loader.style.display = 'none', 300);
        }
    }, 1000);

    // Add fade-in animation to sections
    const sections = document.querySelectorAll('.fade-in-section');
    sections.forEach((section, index) => {
        setTimeout(() => {
            section.style.opacity = '1';
            section.style.transform = 'translateY(0)';
        }, 300 + (index * 100));
    });

    // Phone number validation
    const phoneInputs = document.querySelectorAll('input[type="tel"]');
    phoneInputs.forEach(input => {
        input.addEventListener('input', function() {
            // Remove non-numeric characters
            this.value = this.value.replace(/\D/g, '');
            
            // Limit to 10 digits
            if (this.value.length > 10) {
                this.value = this.value.slice(0, 10);
            }
        });
    });

    // Real-time password validation
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    
    function validatePasswords() {
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        
        // Reset styles
        passwordInput.style.borderColor = '';
        confirmPasswordInput.style.borderColor = '';
        
        if (password && password.length < 6) {
            passwordInput.style.borderColor = '#e74c3c';
        }
        
        if (confirmPassword && password !== confirmPassword) {
            confirmPasswordInput.style.borderColor = '#e74c3c';
        } else if (confirmPassword && password === confirmPassword) {
            confirmPasswordInput.style.borderColor = '#27ae60';
        }
    }
    
    passwordInput.addEventListener('input', validatePasswords);
    confirmPasswordInput.addEventListener('input', validatePasswords);

    // Username availability check (optional enhancement)
    const usernameInput = document.getElementById('username');
    usernameInput.addEventListener('blur', function() {
        const username = this.value.trim();
        if (username.length >= 3) {
            // You could add real-time username availability check here
            // For now, just basic validation
            if (!/^[a-zA-Z0-9_]+$/.test(username)) {
                this.style.borderColor = '#e74c3c';
                showMessage('Username can only contain letters, numbers, and underscore', 'error', 3000);
            } else {
                this.style.borderColor = '';
            }
        }
    });
});

// Main registration function
async function registerDeliveryPartner(event) {
    event.preventDefault();
    
    const form = document.getElementById('delivery-registration-form');
    const submitBtn = form.querySelector('button[type="submit"]');
    
    // Disable submit button to prevent double submission
    submitBtn.disabled = true;
    submitBtn.textContent = 'Registering...';
    
    try {
        // Collect form data
        const formData = new FormData(form);
        const registrationData = {
            username: formData.get('username').trim(),
            password: formData.get('password'),
            fullName: formData.get('fullName').trim(),
            phoneNo: formData.get('phoneNo').trim(),
            address: formData.get('address').trim(),
            emergencyContact: formData.get('emergencyContact').trim() || null,
            licenseNumber: formData.get('licenseNumber').trim(),
            vehicleType: formData.get('vehicleType')
        };
        
        // Client-side validation
        const validation = validateRegistrationData(registrationData, formData.get('confirmPassword'));
        if (!validation.isValid) {
            showMessage(validation.message, 'error');
            return;
        }
        
        // Show loading state
        showMessage('Creating your delivery partner account...', 'info');
        
        // Send registration request
        const response = await fetch('/api/users/delivery/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(registrationData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showMessage(
                '✅ Registration successful! Your application is under review. You will be notified once approved.', 
                'success',
                5000
            );
            
            // Clear form after successful registration
            form.reset();
            
            // Redirect to login after a delay
            setTimeout(() => {
                window.location.href = 'delivery_login.html';
            }, 3000);
            
        } else {
            // Handle specific error cases
            let errorMessage = result.message || 'Registration failed. Please try again.';
            
            if (response.status === 409) {
                errorMessage = 'Username already exists. Please choose a different username.';
            } else if (response.status === 400) {
                errorMessage = result.message || 'Invalid registration data. Please check your inputs.';
            }
            
            showMessage(errorMessage, 'error');
        }
        
    } catch (error) {
        console.error('Registration error:', error);
        showMessage('Network error. Please check your connection and try again.', 'error');
    } finally {
        // Re-enable submit button
        submitBtn.disabled = false;
        submitBtn.textContent = 'Register as Delivery Partner';
    }
}

// Client-side validation function
function validateRegistrationData(data, confirmPassword) {
    // Required fields validation
    const requiredFields = ['username', 'password', 'fullName', 'phoneNo', 'address', 'licenseNumber', 'vehicleType'];
    for (const field of requiredFields) {
        if (!data[field] || data[field].toString().trim() === '') {
            return {
                isValid: false,
                message: `${field.charAt(0).toUpperCase() + field.slice(1)} is required.`
            };
        }
    }
    
    // Username validation
    if (data.username.length < 3) {
        return {
            isValid: false,
            message: 'Username must be at least 3 characters long.'
        };
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(data.username)) {
        return {
            isValid: false,
            message: 'Username can only contain letters, numbers, and underscore.'
        };
    }
    
    // Password validation
    if (data.password.length < 6) {
        return {
            isValid: false,
            message: 'Password must be at least 6 characters long.'
        };
    }
    
    if (data.password !== confirmPassword) {
        return {
            isValid: false,
            message: 'Passwords do not match.'
        };
    }
    
    // Phone number validation
    if (!/^\d{10}$/.test(data.phoneNo)) {
        return {
            isValid: false,
            message: 'Phone number must be exactly 10 digits.'
        };
    }
    
    // Emergency contact validation (if provided)
    if (data.emergencyContact && !/^\d{10}$/.test(data.emergencyContact)) {
        return {
            isValid: false,
            message: 'Emergency contact must be exactly 10 digits.'
        };
    }
    
    // License number validation
    if (data.licenseNumber.length < 5) {
        return {
            isValid: false,
            message: 'License number must be at least 5 characters long.'
        };
    }
    
    // Vehicle type validation
    const validVehicleTypes = ['bike', 'scooter', 'car', 'cycle'];
    if (!validVehicleTypes.includes(data.vehicleType)) {
        return {
            isValid: false,
            message: 'Please select a valid vehicle type.'
        };
    }
    
    return { isValid: true };
}

// Message display function
function showMessage(message, type = 'info', duration = 5000) {
    const container = document.getElementById('message-container');
    const messageText = document.getElementById('message-text');
    
    // Set message content and type
    messageText.textContent = message;
    container.className = `message-container ${type}`;
    container.style.display = 'block';
    
    // Smooth show animation
    setTimeout(() => {
        container.style.opacity = '1';
        container.style.transform = 'translateY(0)';
    }, 10);
    
    // Auto-hide after duration
    setTimeout(() => {
        hideMessage();
    }, duration);
}

// Hide message function
function hideMessage() {
    const container = document.getElementById('message-container');
    container.style.opacity = '0';
    container.style.transform = 'translateY(-20px)';
    
    setTimeout(() => {
        container.style.display = 'none';
    }, 300);
}

// Add some CSS for message styling
const style = document.createElement('style');
style.textContent = `
    .message-container {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 1000;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        max-width: 400px;
        opacity: 0;
        transform: translateY(-20px);
        transition: all 0.3s ease;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    
    .message-container.success {
        background-color: #27ae60;
        border-left: 4px solid #2ecc71;
    }
    
    .message-container.error {
        background-color: #e74c3c;
        border-left: 4px solid #c0392b;
    }
    
    .message-container.info {
        background-color: #3498db;
        border-left: 4px solid #2980b9;
    }
    
    .delivery-card {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
    }
    
    .delivery-card h2,
    .delivery-card h3 {
        color: white;
    }
    
    .delivery-card label {
        color: #f8f9fa;
        font-weight: 500;
    }
    
    .delivery-card input,
    .delivery-card textarea,
    .delivery-card select {
        background-color: rgba(255,255,255,0.9);
        color: #333;
        border: 1px solid rgba(255,255,255,0.3);
    }
    
    .delivery-card input:focus,
    .delivery-card textarea:focus,
    .delivery-card select:focus {
        background-color: white;
        border-color: #ff6b6b;
        box-shadow: 0 0 0 2px rgba(255, 107, 107, 0.2);
    }
    
    .security-note {
        background-color: rgba(255,255,255,0.1);
        padding: 10px;
        border-radius: 6px;
        font-size: 0.9em;
        margin-bottom: 20px;
        border-left: 3px solid #ffd700;
    }
    
    .delivery-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    
    .info-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 20px;
        margin-bottom: 20px;
    }
    
    .info-item {
        display: flex;
        justify-content: space-between;
        padding: 10px;
        background-color: rgba(255,255,255,0.1);
        border-radius: 6px;
        border-left: 3px solid #ff6b6b;
    }
    
    .info-item label {
        font-weight: 600;
        color: #ffd700;
    }
    
    @media (max-width: 768px) {
        .message-container {
            left: 20px;
            right: 20px;
            top: 10px;
            max-width: none;
        }
        
        .info-grid {
            grid-template-columns: 1fr;
        }
    }
`;
document.head.appendChild(style);