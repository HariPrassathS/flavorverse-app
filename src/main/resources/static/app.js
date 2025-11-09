document.addEventListener('DOMContentLoaded', () => {

    // --- Mouse-Follow Glow Effect ---
    // Creates a div that follows the mouse cursor to create a soft glow effect.
    const glow = document.createElement('div');
    glow.className = 'cursor-glow';
    document.body.appendChild(glow);
    document.addEventListener('mousemove', (e) => {
        // Use requestAnimationFrame for smoother browser rendering
        requestAnimationFrame(() => {
            glow.style.left = `${e.clientX}px`;
            glow.style.top = `${e.clientY}px`;
        });
    });

    // --- Button Ripple Effect ---
    // Adds a material design-style ripple effect when any button with the '.btn' class is clicked.
    document.body.addEventListener('click', function(e) {
        if (e.target.matches('.btn')) {
            const btn = e.target;
            const rect = btn.getBoundingClientRect();
            const ripple = document.createElement('span');
            ripple.className = 'ripple';
            
            // Calculate the size and position of the ripple
            ripple.style.width = ripple.style.height = Math.max(rect.width, rect.height) + 'px';
            ripple.style.left = e.clientX - rect.left - ripple.offsetWidth / 2 + 'px';
            ripple.style.top = e.clientY - rect.top - ripple.offsetHeight / 2 + 'px';
            
            // Remove any existing ripple before adding a new one
            const existingRipple = btn.querySelector('.ripple');
            if (existingRipple) {
                existingRipple.remove();
            }
            
            btn.appendChild(ripple);
        }
    });

    // --- Hide Loader on Page Load ---
    // Fades out the loading screen once all page content (including images) is fully loaded.
    const loaderWrapper = document.querySelector('.loader-wrapper');
    window.addEventListener('load', () => {
        if (loaderWrapper) {
            loaderWrapper.style.opacity = '0';
            // After the fade-out animation completes, hide the element to prevent interaction.
            setTimeout(() => {
                loaderWrapper.style.display = 'none';
            }, 500); // This duration must match the transition duration in the CSS.
        }
    });
});

