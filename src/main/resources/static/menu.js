// === SEARCH LOGIC ah thani function ah maathrom ===
function filterMenuCards(searchTerm) {
    const menuContainer = document.getElementById('menu-item-container');
    const noResultsMessage = document.getElementById('no-menu-results');
    if (!menuContainer) return; // Menu page la illana stop pannu
    
    const menuItems = menuContainer.querySelectorAll('.restaurant-card');
    let itemsFound = false;

    menuItems.forEach(item => {
        const itemName = item.querySelector('h3').textContent.toLowerCase();
        
        if (itemName.includes(searchTerm)) {
            item.style.display = 'block'; 
            itemsFound = true;
        } else {
            item.style.display = 'none'; 
        }
    });

    noResultsMessage.style.display = itemsFound || searchTerm.length === 0 ? 'none' : 'block';
}


document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const restaurantId = params.get('id');

    // === FIX: Ippo namma 'menu.html' la mattum thaan indha code ah run pannuvom ===
    // (Idhu 'restaurantId' illadha page la error varradha thadukkum)
    if (restaurantId) {
        // Page load la ella data vum fetch panrom
        fetchRestaurantDetails(restaurantId);
        fetchMenuItems(restaurantId);
        fetchRestaurantReviews(restaurantId);
        fetchAiSummary(restaurantId);
    } else {
        const mainContainer = document.querySelector('main.container');
        // 'menu.html' la id illana mattum indha message ah kaatu
        if (window.location.pathname.endsWith('menu.html') && mainContainer) {
            mainContainer.innerHTML = '<h2 style="text-align: center; padding: 50px 0;">No restaurant selected. Please go back to the homepage.</h2>';
        }
    }

    // === Menu Search Logic ===
    const searchBar = document.getElementById('menu-search-bar');
    if (searchBar) { // searchBar irundha mattum work aagu
        searchBar.addEventListener('keyup', () => {
            filterMenuCards(searchBar.value.toLowerCase());
        });
    }
    
    // === FIX: Mic Button Logic (Ippo idhu work aagum!) ===
    // Namma crash aagadha irukka 'setupVoiceSearch' ah inga call panrom
    setupVoiceSearch();


    // === FIX: "ADD REVIEW" FORM LOGIC (Ippo idhu work aagum!) ===
    const reviewForm = document.getElementById('review-form');
    const stars = document.querySelectorAll('.star-input');
    const reviewError = document.getElementById('review-error');
    const reviewSubmitBtn = document.getElementById('submit-review-btn');
    let currentRating = 0;

    // Review form irundha mattum indha logic ah run pannu
    if (reviewForm) {
        // Star rating kaga event listeners
        stars.forEach(star => {
            star.addEventListener('click', () => {
                currentRating = parseInt(star.getAttribute('data-value'));
                stars.forEach(s => {
                    s.classList.remove('selected');
                    if (parseInt(s.getAttribute('data-value')) <= currentRating) {
                        s.classList.add('selected');
                    }
                });
            });

            star.addEventListener('mouseover', () => {
                stars.forEach(s => {
                    s.classList.remove('hover');
                    if (parseInt(s.getAttribute('data-value')) <= parseInt(star.getAttribute('data-value'))) {
                        s.classList.add('hover');
                    }
                });
            });

            star.addEventListener('mouseout', () => {
                stars.forEach(s => s.classList.remove('hover'));
            });
        });

        // Form Submit panna enna pannanum
        reviewForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 
            reviewSubmitBtn.disabled = true;
            reviewSubmitBtn.textContent = 'Submitting...';
            reviewError.style.display = 'none';

            const comment = document.getElementById('review-comment').value;
            
            // FIX: 'localStorage' ku badhilaga 'sessionStorage' use panrom
            const loggedInUserString = sessionStorage.getItem('loggedInUser');
            const loggedInUser = loggedInUserString ? JSON.parse(loggedInUserString) : null;
            
            if (!loggedInUser || !loggedInUser.id) {
                showReviewError("You must be logged in to post a review. Please login and try again.");
                return;
            }
            if (currentRating === 0) {
                showReviewError("Please select a star rating (1-5).");
                return;
            }
            if (!comment) {
                showReviewError("Please write a comment.");
                return;
            }

            try {
                const response = await fetch('/api/reviews/add', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        restaurantId: parseInt(restaurantId),
                        userId: loggedInUser.id,
                        rating: currentRating,
                        comment: comment
                    })
                });

                if (!response.ok) {
                    throw new Error('Failed to submit review. Server responded with ' + response.status);
                }

                Toastify({ text: 'Review submitted successfully!', duration: 3000, style: { background: "linear-gradient(to right, #00b09b, #96c93d)" }}).showToast();
                
                reviewForm.reset();
                stars.forEach(s => s.classList.remove('selected'));
                currentRating = 0;
                reviewSubmitBtn.disabled = false;
                reviewSubmitBtn.textContent = 'Submit Review';

                // AI FEATURES ah REFRESH panrom
                fetchRestaurantReviews(restaurantId);
                fetchAiSummary(restaurantId);
                fetchAiMenuTags(restaurantId);

            } catch (err) {
                console.error(err);
                showReviewError("An error occurred. Please try again.");
            }
        });

        function showReviewError(message) {
            reviewError.textContent = message;
            reviewError.style.display = 'block';
            reviewSubmitBtn.disabled = false;
            reviewSubmitBtn.textContent = 'Submit Review';
        }
    } // End of reviewForm check
});


// ===============================================
// === PUTHU "VOICE SEARCH" FUNCTION (FIXED) ===
// ===============================================
function setupVoiceSearch() {
    // Browser la Web Speech API irukka nu check panrom
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const voiceSearchBtn = document.getElementById('voice-search-btn');
    const searchBar = document.getElementById('menu-search-bar');

    // === FIX: Mic button illana (e.g., index.html), crash aagama stop pannidalam ===
    if (!voiceSearchBtn || !searchBar || !SpeechRecognition) {
        if (voiceSearchBtn) {
            voiceSearchBtn.style.display = 'none'; // Browser support illana, button ah hide pannidalam
        }
        return; // Function ah stop pannidalam
    }
    // =========================================================================

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN'; // Indian English kaga
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    // Mic button ah click panna
    voiceSearchBtn.addEventListener('click', () => {
        try {
            recognition.start();
            voiceSearchBtn.classList.add('recording'); // Red color kaga
            searchBar.placeholder = 'Listening...';
        } catch(e) {
            console.error("Voice recognition already active.", e);
        }
    });

    // Pesi mudichadhum, result varum
    recognition.onresult = (event) => {
        const speechResult = event.results[0][0].transcript;
        
        searchBar.value = speechResult;
        filterMenuCards(speechResult.toLowerCase()); // Filter ah trigger panrom
    };

    // Pesi mudicha apram (or error aana)
    recognition.onend = () => {
        voiceSearchBtn.classList.remove('recording'); // Red color ah remove pannu
        searchBar.placeholder = 'Search menu items...';
    };

    // Error aana
    recognition.onerror = (event) => {
        console.error("Voice search error:", event.error);
        let errorMsg = "Sorry, I didn't catch that. Please try again.";
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            errorMsg = "Please allow microphone access to use voice search.";
        }
        
        Toastify({ 
            text: errorMsg, 
            duration: 3000, 
            gravity: "top", 
            position: "right",
            style: { background: "linear-gradient(to right, #ff5f6d, #ffc371)" }
        }).showToast();
    };
}


// ===============================================
// (Matha ella functions um global scope la irukku)
// ===============================================

function fetchRestaurantDetails(id) {
    fetch(`/api/restaurants/${id}`)
        .then(response => response.json())
        .then(restaurant => {
            const infoSection = document.getElementById('restaurant-info');
            if(infoSection) infoSection.innerHTML = `<h1>${restaurant.name}</h1><p>${restaurant.address}</p>`;
        });
}

function fetchMenuItems(id) {
    const container = document.getElementById('menu-item-container');
    if (!container) return; 
    
    fetch(`/api/menu/${id}`)
        .then(response => response.json())
        .then(menuItems => {
            container.innerHTML = ''; 

            if (menuItems.length === 0) {
                container.innerHTML = '<p>This restaurant has no menu items yet.</p>';
                return;
            }

            menuItems.forEach(item => {
                const itemCard = document.createElement('div');
                itemCard.className = 'restaurant-card'; 
                itemCard.id = `menu-item-${item.id}`; 
                
                const imageUrl = item.imageUrl || 'https://placehold.co/600x400/eeeeee/aaaaaa?text=Image+Not+Available';

                itemCard.innerHTML = `
                    <img src="${imageUrl}" alt="${item.name}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px 8px 0 0;">
                    
                    <div class="restaurant-card-content">
                        <div class="menu-item-header">
                            <h3>${item.name}</h3>
                            <span class="ai-menu-tag" style="display: none;"></span>
                        </div>
                        <p>${item.description}</p>
                        <p style="font-weight: bold; color: var(--primary-green);">₹${item.price.toFixed(2)}</p>
                        
                        <div class="menu-card-buttons">
                           <button class="btn" onclick="addToCart(${item.id}, '${item.name}', ${item.price})">Add to Cart</button>
                        </div>
                    </div>
                `;
                container.appendChild(itemCard);
            });
            
            fetchAiMenuTags(id);
        });
}

function fetchRestaurantReviews(id) {
    const container = document.getElementById('customer-reviews-container');
    if (!container) return;
    
    container.innerHTML = '<p class="loader-text">Loading reviews...</p>'; 
    
    fetch(`/api/reviews/restaurant/${id}`)
        .then(response => response.json())
        .then(reviews => {
            if (reviews.length === 0) {
                container.innerHTML = '<p>No reviews yet for this restaurant.</p>';
                return;
            }
            reviews.sort((a, b) => new Date(b.datePosted) - new Date(a.datePosted));
            container.innerHTML = ''; 

            reviews.forEach(review => {
                const reviewCard = document.createElement('div');
                reviewCard.className = 'review-card'; 
                const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
                const userName = review.user ? review.user.username : 'Anonymous User';
                reviewCard.innerHTML = `
                    <div class="review-rating">${stars}</div>
                    <p class="review-comment">"${review.comment}"</p>
                    <div class="review-user">- ${userName}</div>
                `;
                container.appendChild(reviewCard);
            });
        })
        .catch(error => {
            console.error('Error fetching reviews:', error);
            container.innerHTML = '<p>Could not load reviews at this time.</p>';
        });
}

function fetchAiSummary(id) {
    const summaryContainer = document.getElementById('ai-summary-section');
    const summaryTextElement = document.getElementById('ai-summary-text');
    if (!summaryContainer) return;

    summaryTextElement.textContent = 'Generating summary...';

    fetch(`/api/reviews/restaurant/${id}/summary`)
        .then(response => {
            if (!response.ok) {
                if (response.status === 400) { 
                    throw new Error("Not enough reviews");
                }
                return response.text().then(text => { throw new Error(text) });
            }
            return response.text();
        })
        .then(summary => {
            summaryTextElement.textContent = summary;
            summaryContainer.style.display = 'block'; 
        })
        .catch(error => {
            console.error('Error fetching AI summary:', error);
            summaryContainer.style.display = 'none';
        });
}

async function fetchAiMenuTags(id) {
    try {
        document.querySelectorAll('.ai-menu-tag').forEach(tag => {
            tag.style.display = 'none';
            tag.textContent = '';
        });

        const response = await fetch(`/api/reviews/restaurant/${id}/tags`);
        if (!response.ok) {
            console.error("AI Tags API failed with status:", response.status);
            return;
        }
        const tagsMap = await response.json(); 
        
        for (const [itemId, tag] of Object.entries(tagsMap)) {
            const card = document.getElementById(`menu-item-${itemId}`);
            if (card) {
                const tagElement = card.querySelector('.ai-menu-tag');
                if (tagElement) {
                    tagElement.textContent = `✨ ${tag}`;
                    tagElement.style.display = 'inline-block';
                    tagElement.classList.remove('positive', 'negative');
                    if (tag.toLowerCase().includes('must') || tag.toLowerCase().includes('delicious') || tag.toLowerCase().includes('popular')) {
                        tagElement.classList.add('positive');
                    } else if (tag.toLowerCase().includes('spicy') || tag.toLowerCase().includes('avoid') || tag.toLowerCase().includes('bad')) {
                        tagElement.classList.add('negative');
                    }
                }
            }
        }
    } catch (e) {
        console.error("Error fetching or parsing AI tags:", e);
    }
}

function addToCart(itemId, itemName, itemPrice) {
    const params = new URLSearchParams(window.location.search);
    const restaurantId = params.get('id');
    let cart = JSON.parse(sessionStorage.getItem('cart')) || [];
    const cartRestaurantId = sessionStorage.getItem('cartRestaurantId');
    if (cart.length > 0 && cartRestaurantId !== restaurantId) {
        if (!confirm("Your cart contains items from another restaurant. Would you like to clear it and add this item?")) {
            return; 
        }
        cart = []; 
    }
    sessionStorage.setItem('cartRestaurantId', restaurantId); 
    const existingItem = cart.find(item => item.id === itemId);
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({ id: itemId, name: itemName, price: itemPrice, quantity: 1 });
    }
    sessionStorage.setItem('cart', JSON.stringify(cart));
    Toastify({
        text: `'${itemName}' was added to your cart!`,
        duration: 3000,
        gravity: "top", 
        position: "right", 
        style: {
          background: "linear-gradient(to right, #00b09b, #96c93d)",
        },
        stopOnFocus: true, 
    }).showToast();
}