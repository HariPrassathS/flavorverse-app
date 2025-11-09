document.getElementById('login-form').addEventListener('submit', function(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

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
        // --- PUTHU CHANGE INGEY ---
        // Login successful! Show green toast.
        Toastify({
            text: "Login Successful! Welcome back.",
            duration: 2000, // Show for 2 seconds before redirecting
            gravity: "top", position: "right",
            style: { background: "linear-gradient(to right, #00b09b, #96c93d)" }, // Green gradient
            stopOnFocus: true,
            callback: function() { 
                // Toast mudinjathum, redirect pannu
                sessionStorage.setItem('loggedInUser', JSON.stringify(user));
                window.location.href = '/'; // Redirect to homepage
            } 
        }).showToast();
        // --- CHANGE MUDINJUTHU ---

        // Pazhaya redirect line-a comment pannidunga illa delete pannidunga
        // sessionStorage.setItem('loggedInUser', JSON.stringify(user));
        // window.location.href = '/'; 
    })
    .catch(error => {
        console.error('Login error:', error);
        // Error toast (ithu appadiye irukatum)
        Toastify({
            text: error.message, 
            duration: 3000,
            gravity: "top", position: "right",
            style: { 
                background: "linear-gradient(to right, #ff5f6d, #ffc371)" 
            }
        }).showToast();
    });
});