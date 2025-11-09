document.getElementById('register-form').addEventListener('submit', function(event) {
    event.preventDefault();
    // const messageEl = document.getElementById('message'); // Theva illa

    const userData = {
        fullName: document.getElementById('fullName').value,
        username: document.getElementById('username').value,
        phoneNo: document.getElementById('phoneNo').value,
        address: document.getElementById('address').value,
        password: document.getElementById('password').value,
    };

    fetch('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
    })
    .then(response => {
        if (!response.ok) {
            return response.text().then(text => { throw new Error(text || 'Registration failed') });
        }
        return response.json();
    })
    .then(user => {
        // Show success toast and redirect
        Toastify({
            text: 'Registration successful! Redirecting to login...',
            duration: 2000, gravity: "top", position: "right",
            style: { background: "linear-gradient(to right, #00b09b, #96c93d)" },
            callback: function() {
                 window.location.href = 'login.html';
            }
        }).showToast();
    })
    .catch(error => {
        console.error('Registration error:', error);
         // Show error toast (e.g., "Username is already taken!")
         Toastify({
            text: error.message,
            duration: 3000, gravity: "top", position: "right",
            style: { background: "linear-gradient(to right, #ff5f6d, #ffc371)" }
        }).showToast();
    });
});