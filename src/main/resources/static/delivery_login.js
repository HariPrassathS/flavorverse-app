/* === Enhanced Delivery Partner Login with Better UX === */

document.addEventListener('DOMContentLoaded', () => {
    initializeLoginPage();
    setupFormAnimations();
    loadRememberedCredentials();
});

// Initialize page elements and animations
function initializeLoginPage() {
    // Remove loader after page loads
    setTimeout(() => {
        const loader = document.querySelector('.loader-wrapper');
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => loader.remove(), 300);
        }
    }, 500);

    // Add focus animations to inputs
    setupInputAnimations();
    
    // Check for existing session
    checkExistingSession();
}

// Setup input field animations and interactions
function setupInputAnimations() {
    const inputs = document.querySelectorAll('.form-input');
    
    inputs.forEach(input => {
        const wrapper = input.closest('.input-group');
        
        // Handle focus and blur events
        input.addEventListener('focus', () => {
            if (wrapper) wrapper.classList.add('focused');
        });
        
        input.addEventListener('blur', () => {
            if (!input.value.trim() && wrapper) {
                wrapper.classList.remove('focused');
            }
        });
        
        // Handle input events for real-time validation
        input.addEventListener('input', () => {
            validateInput(input);
        });
        
        // Check if input already has value (for autofill)
        if (input.value.trim() && wrapper) {
            wrapper.classList.add('focused');
        }
    });
}

// Real-time input validation
function validateInput(input) {
    const wrapper = input.closest('.input-group');
    const inputType = input.type;
    const value = input.value.trim();
    
    // Remove existing validation classes
    if (wrapper) {
        wrapper.classList.remove('error', 'success');
        
        if (value) {
            if (inputType === 'text' && value.length >= 3) {
                wrapper.classList.add('success');
            } else if (inputType === 'password' && value.length >= 6) {
                wrapper.classList.add('success');
            }
        }
    }
}

// Setup form animations
function setupFormAnimations() {
    const formElements = document.querySelectorAll('.input-group, .login-button, .social-login');
    
    formElements.forEach((element, index) => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            element.style.transition = 'all 0.5s ease';
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }, 200 + (index * 100));
    });
}

// Enhanced login form handler
async function handleLogin(event) {
    event.preventDefault();
    
    const loginBtn = document.getElementById('login-btn');
    const buttonText = loginBtn.querySelector('.button-text');
    const buttonLoading = loginBtn.querySelector('.button-loading');
    
    // Get form data
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('remember-me').checked;
    
    // Validate inputs
    if (!validateLoginForm(username, password)) {
        return;
    }
    
    // Show loading state
    setLoadingState(true);
    
    try {
        const response = await fetch('/api/users/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        if (response.ok) {
            const user = await response.json();
            
            // Verify this is a delivery partner
            if (user.role !== 'ROLE_DELIVERY_PARTNER') {
                setLoadingState(false);
                showToast('error', 'Access Denied', 'This portal is for delivery partners only');
                animateError();
                return;
            }
            
            // Store user session
            sessionStorage.setItem('loggedInUser', JSON.stringify(user));
            
            // Remember credentials if checked
            if (rememberMe) {
                localStorage.setItem('delivery_username', username);
            } else {
                localStorage.removeItem('delivery_username');
            }
            
            // Show success message
            showToast('success', 'Login Successful!', 'Welcome back to StarkBites Delivery');
            
            // Animate success
            animateSuccess();
            
            // Redirect after delay
            setTimeout(() => {
                window.location.href = 'delivery_home.html';
            }, 2000);
            
        } else {
            const errorText = await response.text();
            setLoadingState(false);
            showToast('error', 'Login Failed', errorText);
            animateError();
        }
    } catch (error) {
        setLoadingState(false);
        showToast('error', 'Connection Error', 'Unable to connect to server. Please try again.');
        animateError();
    }
}

// Validate login form
function validateLoginForm(username, password) {
    let isValid = true;
    
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const usernameWrapper = usernameInput ? usernameInput.closest('.input-group') : null;
    const passwordWrapper = passwordInput ? passwordInput.closest('.input-group') : null;
    
    // Reset validation states
    if (usernameWrapper) usernameWrapper.classList.remove('error');
    if (passwordWrapper) passwordWrapper.classList.remove('error');
    
    if (!username || username.length < 3) {
        if (usernameWrapper) usernameWrapper.classList.add('error');
        showToast('warning', 'Invalid Username', 'Username must be at least 3 characters');
        isValid = false;
    }
    
    if (!password || password.length < 6) {
        if (passwordWrapper) passwordWrapper.classList.add('error');
        if (isValid) { // Only show if username is valid
            showToast('warning', 'Invalid Password', 'Password must be at least 6 characters');
        }
        isValid = false;
    }
    
    return isValid;
}

// Set loading state for login button
function setLoadingState(loading) {
    const loginBtn = document.getElementById('login-btn');
    const buttonText = loginBtn.querySelector('.button-text');
    const buttonLoading = loginBtn.querySelector('.button-loading');
    
    if (loading) {
        buttonText.style.display = 'none';
        buttonLoading.style.display = 'flex';
        loginBtn.disabled = true;
        loginBtn.classList.add('loading');
    } else {
        buttonText.style.display = 'flex';
        buttonLoading.style.display = 'none';
        loginBtn.disabled = false;
        loginBtn.classList.remove('loading');
    }
}

// Enhanced toast notification system
function showToast(type, title, message) {
    const toast = document.getElementById('message-toast');
    const toastIcon = toast.querySelector('.toast-icon i');
    const toastTitle = toast.querySelector('.toast-title');
    const toastMessage = toast.querySelector('.toast-message');
    
    // Set content
    toastTitle.textContent = title;
    toastMessage.textContent = message;
    
    // Set icon and styling based on type
    toast.className = `message-toast ${type}`;
    
    switch (type) {
        case 'success':
            toastIcon.className = 'fas fa-check-circle';
            break;
        case 'error':
            toastIcon.className = 'fas fa-exclamation-circle';
            break;
        case 'warning':
            toastIcon.className = 'fas fa-exclamation-triangle';
            break;
        default:
            toastIcon.className = 'fas fa-info-circle';
    }
    
    // Show toast with animation
    toast.style.display = 'block';
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Auto hide after 5 seconds (except for success)
    if (type !== 'success') {
        setTimeout(() => {
            hideToast();
        }, 5000);
    }
}

// Hide toast notification
function hideToast() {
    const toast = document.getElementById('message-toast');
    toast.classList.remove('show');
    setTimeout(() => {
        toast.style.display = 'none';
    }, 300);
}

// Animate success feedback
function animateSuccess() {
    const loginCard = document.querySelector('.login-card');
    loginCard.classList.add('success-animation');
    
    // Add confetti effect (simple version)
    createConfetti();
}

// Animate error feedback
function animateError() {
    const loginCard = document.querySelector('.login-card');
    loginCard.classList.add('error-shake');
    
    setTimeout(() => {
        loginCard.classList.remove('error-shake');
    }, 500);
}

// Simple confetti effect
function createConfetti() {
    const colors = ['#28a745', '#17a2b8', '#ffc107', '#dc3545', '#6f42c1'];
    const confettiCount = 50;
    
    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.animationDelay = Math.random() * 2 + 's';
        confetti.style.animationDuration = (Math.random() * 3 + 2) + 's';
        
        document.body.appendChild(confetti);
        
        setTimeout(() => confetti.remove(), 5000);
    }
}

// Password visibility toggle
function togglePassword() {
    const passwordInput = document.getElementById('password');
    const passwordEye = document.getElementById('password-eye');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        passwordEye.className = 'fas fa-eye-slash';
    } else {
        passwordInput.type = 'password';
        passwordEye.className = 'fas fa-eye';
    }
}

// Forgot password modal
function showForgotPassword() {
    const modal = document.getElementById('forgot-password-modal');
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('show'), 10);
}

function hideForgotPassword() {
    const modal = document.getElementById('forgot-password-modal');
    modal.classList.remove('show');
    setTimeout(() => modal.style.display = 'none', 300);
}

// Password reset request
function requestPasswordReset() {
    const username = document.getElementById('reset-username').value.trim();
    
    if (!username) {
        showToast('warning', 'Username Required', 'Please enter your username');
        return;
    }
    
    // Simulate password reset request
    showToast('info', 'Reset Requested', 'Password reset instructions will be sent to your registered contact.');
    hideForgotPassword();
}

// Show coming soon message for future features
function showComingSoon() {
    showToast('info', 'Coming Soon', 'This feature will be available in a future update.');
}

// Load remembered credentials
function loadRememberedCredentials() {
    const rememberedUsername = localStorage.getItem('delivery_username');
    const usernameInput = document.getElementById('username');
    const rememberCheckbox = document.getElementById('remember-me');
    
    if (rememberedUsername && usernameInput) {
        usernameInput.value = rememberedUsername;
        if (rememberCheckbox) rememberCheckbox.checked = true;
        
        const wrapper = usernameInput.closest('.input-group');
        if (wrapper) wrapper.classList.add('focused');
    }
}

// Check for existing session
function checkExistingSession() {
    const existingUser = sessionStorage.getItem('loggedInUser');
    if (existingUser) {
        const user = JSON.parse(existingUser);
        if (user.role === 'ROLE_DELIVERY_PARTNER') {
            showToast('info', 'Already Logged In', 'Redirecting to dashboard...');
            setTimeout(() => {
                window.location.href = 'delivery_home.html';
            }, 2000);
        }
    }
}

// Keyboard shortcuts
document.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && event.target.tagName !== 'BUTTON') {
        const form = document.getElementById('delivery-login-form');
        if (form) {
            form.requestSubmit();
        }
    }
    
    if (event.key === 'Escape') {
        hideForgotPassword();
        hideToast();
    }
});

// Close modal when clicking outside
document.addEventListener('click', (event) => {
    const modal = document.getElementById('forgot-password-modal');
    if (event.target === modal) {
        hideForgotPassword();
    }
});

// Add enhanced CSS animations
const enhancedStyles = document.createElement('style');
enhancedStyles.textContent = `
/* Confetti Animation */
.confetti {
    position: fixed;
    width: 10px;
    height: 10px;
    z-index: 9999;
    animation: confetti-fall linear forwards;
}

@keyframes confetti-fall {
    to {
        transform: translateY(100vh) rotate(360deg);
    }
}

/* Success Animation */
.success-animation {
    animation: pulse-success 0.6s ease-in-out;
}

@keyframes pulse-success {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); box-shadow: 0 0 20px rgba(40, 167, 69, 0.4); }
    100% { transform: scale(1); }
}

/* Error Shake Animation */
.error-shake {
    animation: shake 0.5s ease-in-out;
}

@keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
}

/* Input Focus States */
.input-group.focused .form-label {
    color: var(--primary-color);
    transform: translateY(-8px) scale(0.9);
}

.input-group.success .form-input {
    border-color: #28a745;
    box-shadow: 0 0 0 2px rgba(40, 167, 69, 0.25);
}

.input-group.error .form-input {
    border-color: #dc3545;
    box-shadow: 0 0 0 2px rgba(220, 53, 69, 0.25);
}

/* Loading Button State */
.login-button.loading {
    opacity: 0.8;
    cursor: not-allowed;
}

/* Enhanced Toast */
.message-toast.show {
    opacity: 1;
    transform: translateX(0);
}

/* Smooth transitions */
.form-input, .login-button, .input-group {
    transition: all 0.3s ease;
}
`;
document.head.appendChild(enhancedStyles);