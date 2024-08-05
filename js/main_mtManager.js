var map;
var currentLocationMarker;
var startMarker, endMarker; // Declare global variables to store marker references
var currentLocationCoords;

function addMarker(lat, lng) {
    var markerIconU = L.icon({
        iconUrl: 'leaflet/images/marker-icon.png', // Ensure this path is correct
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });
    if (currentLocationMarker) {
        // Update the marker position
        currentLocationMarker.setLatLng([lat, lng]);
    } else {
        // Create a new marker
        currentLocationMarker = L.marker([lat, lng], { icon: markerIconU, draggable: true }).addTo(map).bindPopup('Your Location').openPopup();;
        currentLocationMarker.on('dragend', function(e) {
            onMarkerDragEnd(e, null); // Pass null because we don't need to update input value
        });
    }
    currentLocationCoords = [lat, lng];
    updateSuggestions();
}

function updateSuggestions() {
    startSuggestions[0].coords = currentLocationCoords; // Update "My Location" suggestion
    endSuggestions[0].coords = currentLocationCoords; // Update "My Location" suggestion
}

document.addEventListener('DOMContentLoaded', function() {
    var deviceLocationCoords; // Example device location coordinates
    var clickMode = 'start'; // Initialize clickMode

    // Initialize map
    map = L.map('map').setView([26.9326, 75.8137], 13); // Default view centered on Jaipur

    // Add your locally hosted tiles as the base layer
    L.tileLayer('tiles/{z}/{x}/{y}.png', {
        minZoom: 12,
        maxZoom: 18,
        attribution: 'Map data © OpenStreetMap contributors'
    }).addTo(map);

    var markerIcon = L.icon({
        iconUrl: 'marker-icon.png', // Ensure this path is correct
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    var startInput = document.getElementById('start');
    var endInput = document.getElementById('end');
    var distanceDisplay = document.getElementById('distance');

    startMarker = L.marker([0, 0], { draggable: true }).addTo(map); // Initialize global startMarker
    endMarker = L.marker([0, 0], { draggable: true }).addTo(map); // Initialize global endMarker

    var currentPolyline = null; // Variable to store the current polyline

    // Function to remove the current polyline
    function removeCurrentPolyline() {
        if (currentPolyline) {
            map.removeLayer(currentPolyline);
            currentPolyline = null;
        }
    }

    // Function to handle marker drag events
    function onMarkerDragEnd(e, input) {
        var marker = e.target;
        var position = marker.getLatLng();
        if (input) {
            input.value = position.lat.toFixed(6) + ',' + position.lng.toFixed(6);
        }
        removeCurrentPolyline();
    }

    // Function to show suggestions
    function showSuggestions(inputElement, suggestionsContainer, suggestions) {
        suggestionsContainer.innerHTML = ''; // Clear previous suggestions
        if (suggestions.length === 0) {
            suggestionsContainer.style.display = 'none';
            return;
        }

        suggestions.forEach(suggestion => {
            var suggestionDiv = document.createElement('div');
            suggestionDiv.textContent = suggestion.label;
            suggestionDiv.addEventListener('click', function() {
                inputElement.value = suggestion.coords.join(',');
                if (inputElement.id === 'start') {
                    startMarker.setLatLng(suggestion.coords).setIcon(markerIcon);
                } else {
                    endMarker.setLatLng(suggestion.coords).setIcon(markerIcon);
                }
                suggestionsContainer.style.display = 'none';
                // Optionally trigger route calculation or other action here
            });
            suggestionsContainer.appendChild(suggestionDiv);
        });

        suggestionsContainer.style.display = 'block';
    }

    // Handle focus event to show suggestions
    function handleFocus(event, suggestionsContainer, suggestions) {
        showSuggestions(event.target, suggestionsContainer, suggestions);
    }

    var startSuggestionsContainer = document.getElementById('start-suggestions');
    var endSuggestionsContainer = document.getElementById('end-suggestions');

    // Initialize suggestions
    var startSuggestions = [
        { label: 'My Location', coords: currentLocationCoords },
        { label: 'Device Location', coords: deviceLocationCoords }
    ];

    var endSuggestions = [
        { label: 'My Location', coords: currentLocationCoords },
        { label: 'Device Location', coords: deviceLocationCoords }
    ];

    // Focus event listeners to show suggestions immediately
    startInput.addEventListener('focus', function(event) {
        showSuggestions(this, startSuggestionsContainer, startSuggestions);
    });

    endInput.addEventListener('focus', function(event) {
        showSuggestions(this, endSuggestionsContainer, endSuggestions);
    });

    // Blur event listeners to hide suggestions
    startInput.addEventListener('blur', function() {
        startSuggestionsContainer.style.display = 'none';
    });

    endInput.addEventListener('blur', function() {
        endSuggestionsContainer.style.display = 'none';
    });

    // Get current location using Geolocation API
    // if (navigator.geolocation) {
    //     navigator.geolocation.getCurrentPosition(function(position) {
    //         var latitude = position.coords.latitude;
    //         var longitude = position.coords.longitude;
    //         addMarker(latitude, longitude);
    //     }, function(error) {
    //         console.error('Error getting location: ', error);
    //     });
    // } else {
    //     console.error('Geolocation is not supported by this browser.');
    // }

    
    // Double-tap event handler to add marker
    map.on('dblclick', function(e) {
        if (clickMode === 'start') {
            startInput.value = e.latlng.lat.toFixed(6) + ',' + e.latlng.lng.toFixed(6);
            startMarker.setLatLng(e.latlng).setIcon(markerIcon);
            clickMode = 'end'; // After setting start, switch to setting end
            removeCurrentPolyline(); // Remove the current polyline
        } else {
            endInput.value = e.latlng.lat.toFixed(6) + ',' + e.latlng.lng.toFixed(6);
            endMarker.setLatLng(e.latlng).setIcon(markerIcon);
            clickMode = 'start'; // After setting end, switch back to setting start
            removeCurrentPolyline(); // Remove the current polyline
        }
    });


    // Plan Route button click event handler to fetch and display route
    var planRouteBtn = document.getElementById('planRouteBtn');
    planRouteBtn.addEventListener('click', function() {
        fetchAndDisplayRoute();
    });

    // Function to fetch and display route
    function fetchAndDisplayRoute() {
        var start = startInput.value.trim();
        var end = endInput.value.trim();
        if (!start || !end) {
            alert('Please enter both start and end coordinates.');
            return;
        }
        // Parse the start and end coordinates
        var startCoords = start.split(',').map(Number);
        var endCoords = end.split(',').map(Number);

        // Ensure coordinates are valid
        if (startCoords.length !== 2 || endCoords.length !== 2 || 
            isNaN(startCoords[0]) || isNaN(startCoords[1]) || 
            isNaN(endCoords[0]) || isNaN(endCoords[1])) {
            alert('Please enter valid coordinates in the format "latitude,longitude".');
            return;
        }

        // Remove previous markers
        if (startMarker) {
            map.removeLayer(startMarker);
        }
        if (endMarker) {
            map.removeLayer(endMarker);
        }

        // Create markers for start and end positions
        startMarker = L.marker([startCoords[0], startCoords[1]], {icon: markerIcon}).addTo(map)
            .bindPopup('Start Position').openPopup();
        endMarker = L.marker([endCoords[0], endCoords[1]], {icon: markerIcon}).addTo(map)
            .bindPopup('End Position').openPopup();

        var profile = 'car'; // Specify the vehicle profile (car, bike, foot, etc.)

        var url = ' http://192.168.103.78:8989/route?point=' + start + '&point=' + end + '&profile=' + profile;

        // Using Fetch API for AJAX request
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                console.log('Route data from API:', data);

                // Check the structure of the response object
                if (data.paths && data.paths.length > 0) {
                    var path = data.paths[0];
                    console.log('Path object:', path);

                    // Extract the route coordinates
                    var encodedRoute = path.points;
                    var route = decodePolyline(encodedRoute);
                    console.log('Extracted route coordinates:', route);

                    // Extract and display the distance
                    var distance = path.distance; // Distance is in meters
                    distanceDisplay.textContent = 'Distance: ' + (distance / 1000).toFixed(2) + ' km'; // Convert to km and update the display

                    // Remove the previous polyline if it exists
                    removeCurrentPolyline();

                    // Plotting the route on the map
                    if (route) {
                        currentPolyline = L.polyline(route.map(function(coord) {
                            return [coord[0], coord[1]]; // Leaflet uses [lat, lng]
                        }), { color: 'blue', weight: 5 }).addTo(map);

                        // Fit map to bounds of the route polyline
                        map.fitBounds(currentPolyline.getBounds());
                    } else {
                        console.error('Route coordinates are undefined.');
                    }
                } else {
                    console.error('No route found in the API response.');
                }
            })
            .catch(error => {
                console.error('Error fetching or displaying route:', error);
            });
    }

    let globalMarkers = []; // Global array to store markers

    // Fetch coordinates every 5 seconds
    setInterval(fetchCoordinates, 5000); // Adjusted to 10 seconds as per your requirement
    
    
    
    function fetchCoordinates() {
        fetch('http://192.168.103.78:8000/get_coords')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                const seenVehicleIds = {};
    
                // Clear existing markers
                globalMarkers.forEach(markerObj => {
                    map.removeLayer(markerObj.marker);
                });
                globalMarkers = [];
    
                if (data.coordinates && data.coordinates.length > 0) {
                    data.coordinates.forEach(coord => {
                        const lat = coord.lat;
                        const lng = coord.lng;
                        const vehicleId = parseInt(coord.ID, 10);
    
                        if (!(vehicleId in seenVehicleIds)) {
                            seenVehicleIds[vehicleId] = true;
    
                            // Create marker
                            const marker = L.marker([lat, lng], { icon: markerIcon })
                                .bindPopup(`
                                    <div>
                                        <p>MT Vehicle ID-${vehicleId}</p>
                                        <button class="track-button" data-vehicle-id="${vehicleId}">Track</button>
                                    </div>
                                `);
                            marker.addTo(map);
                            globalMarkers.push({ vehicleId: vehicleId, marker: marker });
                        }
                    });
    
                    // Now attach event listeners using event delegation
                    document.addEventListener('click', function(event) {
                        if (event.target.classList.contains('track-button')) {
                            const vehicleId = event.target.getAttribute('data-vehicle-id');
                            checkTripState(vehicleId);
                        }
                    });
                } else {
                    console.error('No coordinates found');
                }
            })
            .catch(error => console.error('Error fetching coordinates:', error));
    }
    

    
    
    // Function to check trip state based on vehicle ID
    function checkTripState(vehicleId) {
        fetch(`http://192.168.103.78:8000/check_trip_state?vehicleId=${vehicleId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                // console.log('Response from server:', data);
                if (data.available === true) {
                    currentVehicleId = vehicleId;
                    currentRequestId = data.requestId; // Assuming server returns the current request ID
                    showTripT(currentVehicleId, currentRequestId);
                } else {
                    currentVehicleId = vehicleId;
                    showTripF(currentVehicleId);


                }
            })
            .catch(error => {
                console.error('Error checking trip state:', error);
                alert('Failed to check trip state.');
            });
    }
    function showTripT(vehicleId, requestId) {
        // Create the popup block
        const popupBlock = document.createElement('div');
        popupBlock.className = 'popup';
        popupBlock.style.position = 'fixed';
        popupBlock.style.top = '50%';
        popupBlock.style.left = '50%';
        popupBlock.style.transform = 'translate(-50%, -50%)';
        popupBlock.style.boxshadow = '0 0 10px rgba(0, 0, 0, 0.5)';
        popupBlock.style.borderradius = '5px';        
        popupBlock.style.backgroundColor = 'white';
        popupBlock.style.padding = '20px';
        popupBlock.style.border = '1px solid #ccc';
        popupBlock.style.zIndex = '1000';
    
        // Create the content
        const content = document.createElement('p');
        content.textContent = `Vehicle with vehicle ID ${vehicleId} is on trip with request ID ${requestId}.`;
        popupBlock.appendChild(content);
    
        // Close popup on outside click
        const closePopup = () => {
            document.removeEventListener('click', closePopup);
            popupBlock.remove();
        };
        document.addEventListener('click', closePopup);
    
        // Append popup to body
        document.body.appendChild(popupBlock);
    }

    function showTripF(vehicleId) {
        // Create the popup block
        const popupBlock = document.createElement('div');
        popupBlock.className = 'popup';
        popupBlock.style.position = 'fixed';
        popupBlock.style.top = '50%';
        popupBlock.style.left = '50%';
        popupBlock.style.transform = 'translate(-50%, -50%)';
        popupBlock.style.backgroundColor = 'white';
        popupBlock.style.boxshadow = '0 0 10px rgba(0, 0, 0, 0.5)';
        popupBlock.style.borderradius = '5px';
        popupBlock.style.padding = '20px';
        popupBlock.style.border = '1px solid #ccc';
        popupBlock.style.zIndex = '1000';
    
        // Create the content
        const content = document.createElement('p');
        content.textContent = `Vehicle with vehicle ID ${vehicleId} is Available for Trip`;
        popupBlock.appendChild(content);
    
        // Close popup on outside click
        const closePopup = () => {
            document.removeEventListener('click', closePopup);
            popupBlock.remove();
        };
        document.addEventListener('click', closePopup);
    
        // Append popup to body
        document.body.appendChild(popupBlock);
    }
    
    
    
    
    const popup = document.getElementById('popup');
    const nextBtn = document.getElementById('nextBtn');
    const tripBtn = document.getElementById('tripBtn');
    const vehicleIdInput = document.getElementById('vehicleId');
    
    // Event listener for the "Manage Trip" button
    tripBtn.addEventListener('click', () => {
        togglePopup(true); // Display the popup
    });
    
    // Function to toggle popup visibility
    function togglePopup(show) {
        if (show) {
            popup.style.display = 'block';
    
            // Calculate position relative to tripBtn
            const tripBtnRect = tripBtn.getBoundingClientRect();
            const popupRect = popup.getBoundingClientRect();
            const rightOffset = tripBtnRect.right - popupRect.width;
    
            popup.style.top = `${tripBtnRect.bottom + 10}px`; // Adjust 10px or as needed
            popup.style.left = `${rightOffset}px`;
    
            showVehicleIdForm(); // Show the Vehicle ID form by default
    
            // Add event listener to close popup when clicking outside
            document.addEventListener('click', closePopupOutside);
        } else {
            popup.style.display = 'none';
            document.removeEventListener('click', closePopupOutside);
            resetPopup(); // Reset popup state
        }
    }
    
    // Function to close popup when clicking outside
    function closePopupOutside(event) {
        if (!popup.contains(event.target) && event.target !== tripBtn) {
            togglePopup(false);
        }
    }
    
    // Event listener for the "Next" button in the popup
    nextBtn.addEventListener('click', () => {
        const vehicleId = vehicleIdInput.value.trim();
    
        if (vehicleId) {
            focusMarkerForVehicle(vehicleId);
            togglePopup(false); // Close the popup after focusing on the marker
        } else {
            alert('Please enter Vehicle ID.');
        }
    });
    
    function focusMarkerForVehicle(vehicleId) {
        console.log(`Searching for marker with Vehicle ID: ${vehicleId}`);
        console.log('Global markers:', globalMarkers);
    
        // Convert `vehicleId` to number if necessary
        vehicleId = parseInt(vehicleId, 10);
    
        // Find the marker in globalMarkers array
        const markerObj = globalMarkers.find(marker => marker.vehicleId === vehicleId);
    
        if (markerObj) {
            // Focus on the marker or perform other actions
            const marker = markerObj.marker;
            map.setView(marker.getLatLng(), map.getZoom());
            marker.openPopup();
        } else {
            console.error(`Marker not found for Vehicle ID: ${vehicleId}`);
        }
    }
    
    
    // Function to reset popup state
    function resetPopup() {
        vehicleIdInput.value = ''; // Clear Vehicle ID input
        showVehicleIdForm(); // Show the Vehicle ID form
    }
    
    // Function to show only Vehicle ID input form
    function showVehicleIdForm() {
        // No need to change visibility of request ID input/form in this case
    }
    
    // Function to decode polyline
    function decodePolyline(encoded) {
        let points = [];
        let index = 0, len = encoded.length;
        let lat = 0, lng = 0;

        while (index < len) {
            let b, shift = 0, result = 0;
            do {
                b = encoded.charCodeAt(index++) - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20);
            let deltaLat = ((result & 1) ? ~(result >> 1) : (result >> 1));
            lat += deltaLat;

            shift = 0;
            result = 0;
            do {
                b = encoded.charCodeAt(index++) - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20);
            let deltaLng = ((result & 1) ? ~(result >> 1) : (result >> 1));
            lng += deltaLng;

            points.push([lat / 1e5, lng / 1e5]);
        }
        return points;
    }
});
