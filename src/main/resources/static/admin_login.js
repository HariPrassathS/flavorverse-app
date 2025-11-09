document.getElementById('admin-login-form').addEventListener('submit', function(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    // const messageEl = document.getElementById('message'); // Theva illa

    fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    })
    .then(response => {
        if (!response.ok) {
            return response.text().then(text => { throw new Error(text || 'Login failed') });
        }
        return response.json();
    })
    .then(user => {
        if (user.role === 'ROLE_SUPER_ADMIN' || user.role === 'ROLE_ADMIN') {
            // Show success toast and redirect
            Toastify({
                text: "Admin Login Successful!",
                duration: 2000,
                gravity: "top", position: "right",
                style: { background: "linear-gradient(to right, #00b09b, #96c93d)" },
                callback: function() {
                    sessionStorage.setItem('loggedInUser', JSON.stringify(user));
                    window.location.href = '/admin_home.html';
                }
            }).showToast();
        } else {
            // Show error toast for non-admin users
             Toastify({
                text: 'You do not have admin privileges.',
                duration: 3000, gravity: "bottom", position: "right",
                style: { background: "linear-gradient(to right, #ff5f6d, #ffc371)" }
            }).showToast();
        }
    })
    .catch(error => {
        console.error('Admin login error:', error);
        // Show error toast for failed login
         Toastify({
            text: error.message,
            duration: 3000, gravity: "top", position: "right",
            style: { background: "linear-gradient(to right, #ff5f6d, #ffc371)" }
        }).showToast();
    });
});