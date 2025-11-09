// --- Global variables ---
let map;
let deliveryMarker;
let customerMarker; // Customer-kaga puthu marker

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);

    // 'id'-ku bathila 'orderId'-nu thedanum
    const orderId = params.get('orderId');

    if (!orderId) {
        // Use Toastify instead of alert
        Toastify({ text: "No order ID found in URL!", duration: 3000, gravity: "bottom", position: "right", style: { background: "linear-gradient(to right, #ff5f6d, #ffc371)" }}).showToast();
        // Redirect or show error message on page
        document.body.innerHTML = "<h1>Error: No Order ID Found</h1><p>Please go back to your orders page.</p>";
        return;
    }

    // --- 1. Customer Location-a Muthalla Kelu ---
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                // Location kedaichuruchu!
                const customerLatLng = [position.coords.latitude, position.coords.longitude];
                // Ippa map-a initialize pannalam (customer location vachi)
                initializeMapAndTracking(orderId, customerLatLng);
            },
            (error) => {
                // --- GeoLocation Error Handling ---
                console.error("Geolocation Error Code:", error.code); 
                console.error("Geolocation Error Message:", error.message); 
                let errorText = "Could not get your location.";
                if (error.code === 1) { // PERMISSION_DENIED
                    errorText = "Location permission denied. Please allow in browser settings.";
                } else if (error.code === 2) { // POSITION_UNAVAILABLE
                    errorText = "Location information is unavailable.";
                } else if (error.code === 3) { // TIMEOUT
                    errorText = "Location request timed out. Check GPS signal.";
                }
                Toastify({ text: errorText, duration: 4000, gravity: "bottom", position: "right", style: { background: "linear-gradient(to right, #ff5f6d, #ffc371)" }}).showToast();
                // Location kedaikkalanaalum, map-a start pannuvom
                initializeMapAndTracking(orderId, null);
                // --- UPDATE MUDINJUTHU ---
            },
            // === IDHU THAAN MUKKIYA FIX: OPTIONS-A PASS PANROM ===
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 } 
            // ====================================================
        );
    } else {
        // Browser support illa
        Toastify({ text: "Browser doesn't support Geolocation.", duration: 3000, gravity: "bottom", position: "right", style: { background: "linear-gradient(to right, #ff5f6d, #ffc371)" }}).showToast();
        initializeMapAndTracking(orderId, null); // Customer location illama map-a initialize pannu
    }
});

/**
 * Map-a create panni, tracking-a start pannum
 */
function initializeMapAndTracking(orderId, customerLatLng) {
    // Ovvoru 10 second-kum update pannra interval-a clear pannikalam (re-initialization avoid panna)
    if (window.trackingInterval) {
        clearInterval(window.trackingInterval);
    }
    // Map already iruntha atha remove pannidu
    if (map) {
        map.remove();
        map = null; // Ensure map object is cleared
    }

    // Muthalla order details-a fetch pannurom (restaurant location theva)
    fetch(`/api/track/${orderId}`)
        .then(response => {
            if (!response.ok) {
                 // Try to get error text from backend response
                return response.text().then(text => { throw new Error(text || `Could not find order ${orderId}`) });
            }
            return response.json();
        })
        .then(data => {
            // Restaurant location edukrom
            const restaurantLatLng = (data.restaurantLatitude && data.restaurantLongitude && data.restaurantLatitude !== 0)
                                     ? [data.restaurantLatitude, data.restaurantLongitude]
                                     : null; // Restaurant location illana null

            // Map-a enga center pannanum-nu mudivu pannurom
            let initialCenter = [20.5937, 78.9629]; // Default India
            let initialZoom = 5;

            if (customerLatLng) {
                initialCenter = customerLatLng; // Customer location iruntha atha center pannu
                initialZoom = 14; // Konjam zoom pannu
            } else if (restaurantLatLng) {
                initialCenter = restaurantLatLng; // Illana restaurant location-a center pannu
                initialZoom = 14;
            }

            // --- Map-a create pannurom ---
            // Ensure the 'map' div exists before creating the map
            const mapDiv = document.getElementById('map');
            if (!mapDiv) {
                console.error("Map container div not found!");
                return;
            }
            map = L.map('map').setView(initialCenter, initialZoom);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);

            // --- Markers Add Pannurom ---
            // Restaurant Marker (location iruntha mattum)
            if (restaurantLatLng) {
                L.marker(restaurantLatLng).addTo(map).bindPopup("Restaurant");
            }

            // Customer Marker (location kedaichiruntha mattum)
            if (customerLatLng) {
                // Add a specific icon for the customer maybe?
                 const customerIcon = L.icon({
                    iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png', // Simple home icon
                    iconSize: [32, 32],
                    iconAnchor: [16, 32],
                    popupAnchor: [0, -32]
                 });
                customerMarker = L.marker(customerLatLng, {icon: customerIcon}).addTo(map).bindPopup("You are here");
            }

            // Delivery Partner Marker (muthalla restaurant/default location-la vekalam)
             const partnerIcon = L.icon({
                iconUrl: 'https://cdn-icons-png.flaticon.com/512/3004/3004311.png', // Simple delivery icon
                iconSize: [32, 32],
                iconAnchor: [16, 32],
                popupAnchor: [0, -32]
             });
            const partnerInitialLatLng = restaurantLatLng || initialCenter;
            deliveryMarker = L.marker(partnerInitialLatLng, {icon: partnerIcon}).addTo(map).bindPopup("Delivery Partner");

            // Ippa tracking-a start pannalam (muthal call)
            updatePartnerLocation(orderId, data); // Initial data vachi update pannu

            // Ovvoru 10 seconds-kum partner location-a fetch pannu
            window.trackingInterval = setInterval(() => {
                fetchOrderLocationForUpdate(orderId);
            }, 10000);

            // Map view-a adjust pannurom (customer and partner theriyura mathiri)
            adjustMapView(customerLatLng, partnerInitialLatLng, restaurantLatLng);

        })
        .catch(error => {
            console.error("Error initializing map:", error);
            // Show error in the status area
            const statusEl = document.getElementById('order-status');
             if(statusEl) statusEl.textContent = "Error loading map";
             // Show toast notification for the error
             Toastify({ text: `Error loading map: ${error.message}`, duration: 3000, gravity: "bottom", position: "right", style: { background: "linear-gradient(to right, #ff5f6d, #ffc371)" }}).showToast();
        });
}


/**
 * Partner location update-kaga mattum API call pannum
 */
function fetchOrderLocationForUpdate(orderId) {
    fetch(`/api/track/${orderId}`)
        .then(response => response.ok ? response.json() : Promise.reject('Update failed'))
        .then(data => {
            updatePartnerLocation(orderId, data); // Marker-a mattum update pannu
        })
        .catch(error => {
            console.warn("Failed to update partner location:", error);
            // Don't show frequent errors for network issues during updates
        });
}

/**
 * UI and Partner Marker-a update pannum
 */
function updatePartnerLocation(orderId, data) {
    // Update Status and Partner Name only if elements exist
    const statusEl = document.getElementById('order-status');
    const partnerNameEl = document.getElementById('partner-name');
    if (statusEl) statusEl.textContent = data.orderStatus;
    if (partnerNameEl) partnerNameEl.textContent = data.partnerName || 'Not Assigned Yet';


    // Partner location update
    const partnerLatLng = (data.latitude && data.longitude && data.latitude !== 0) ? [data.latitude, data.longitude] : null;

    if (deliveryMarker && partnerLatLng && data.orderStatus === 'PICKED UP') {
        deliveryMarker.setLatLng(partnerLatLng);

        // Adjust map view only if necessary (maybe check distance?)
        const customerLoc = customerMarker ? customerMarker.getLatLng() : null;
        adjustMapView(customerLoc, partnerLatLng, null); // Re-adjust bounds

    } else if (deliveryMarker && data.orderStatus !== 'PICKED UP') {
        // If not picked up, keep partner marker at restaurant or hide it
         const restaurantLatLng = (data.restaurantLatitude && data.restaurantLongitude && data.restaurantLatitude !== 0)
                                     ? [data.restaurantLatitude, data.restaurantLongitude] : (map ? map.getCenter() : null); // Fallback to map center if map exists
         if(restaurantLatLng) deliveryMarker.setLatLng(restaurantLatLng); // Move back only if restaurant location is valid
         // Optionally hide the marker if restaurant location isn't available:
         // else { deliveryMarker.setOpacity(0); }
    }
}

/**
 * Map zoom and center-a adjust pannum (customer/partner/restaurant theriyura mathiri)
 */
function adjustMapView(customerLatLng, partnerLatLng, restaurantLatLng) {
    if (!map) return;

    const bounds = L.latLngBounds([]); // Empty boundary create pannurom

    // Ellam valid locations-ayum bounds-kulla add pannurom
    if (customerLatLng) bounds.extend(customerLatLng);
    // Add partner only if location is valid (not 0,0 or null)
    if (partnerLatLng && partnerLatLng[0] !== 0) bounds.extend(partnerLatLng);
    if (restaurantLatLng) bounds.extend(restaurantLatLng);

    // Bounds valid-a iruntha (atleast oru point iruntha), map-a fit pannurom
    if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50] }); // Konjam padding vechu fit pannu
    } else if (map.getZoom() < 14 && (customerLatLng || restaurantLatLng)) {
        // If bounds are not valid but we have a starting point, zoom in a bit
        map.setZoom(14);
    }
}