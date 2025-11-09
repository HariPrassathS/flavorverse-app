document.addEventListener('DOMContentLoaded', () => {
    fetch('/api/reviews/all')
        .then(response => response.json())
        .then(reviews => displayReviews(reviews))
        .catch(error => {
            console.error("Error fetching reviews:", error);
            document.getElementById('reviews-container').innerHTML = "<p>Could not load reviews.</p>";
        });
});

function displayReviews(reviews) {
    const container = document.getElementById('reviews-container');
    container.innerHTML = '';

    if (reviews.length === 0) {
        container.innerHTML = "<p>No reviews have been submitted yet.</p>";
        return;
    }

    const table = document.createElement('table');
    table.innerHTML = `
        <thead>
            <tr>
                <th>Restaurant</th>
                <th>Customer</th>
                <th>Rating</th>
                <th>Comment</th>
                <th>Date</th>
            </tr>
        </thead>
        <tbody></tbody>
    `;
    const tbody = table.querySelector('tbody');

    reviews.forEach(review => {
        const row = document.createElement('tr');
        const reviewDate = new Date(review.datePosted).toLocaleDateString('en-IN');

        row.innerHTML = `
            <td>${review.restaurant.name}</td>
            <td>${review.user.username}</td>
            <td>${'⭐'.repeat(review.rating)}</td>
            <td>${review.comment}</td>
            <td>${reviewDate}</td>
        `;
        tbody.appendChild(row);
    });

    container.appendChild(table);
}

function logout() {
    sessionStorage.clear();
    window.location.href = '/';
}