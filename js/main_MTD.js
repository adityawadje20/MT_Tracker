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

    var url = 'http://192.168.32.78:8989/route?point=' + start + '&point=' + end + '&profile=' + profile;

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
                var Route_distance = path.distance; // Distance is in meters
                distanceDisplay.innerHTML = 'Distance: ' + (Route_distance / 1000).toFixed(2) + ' km';

                // Remove the previous polyline if it exists
                removeCurrentPolyline();

                // Check if route is valid before plotting
                if (route && route.length > 0) {
                    console.log('Drawing polyline with the following coordinates:', route);

                    currentPolyline = L.polyline(route.map(function(coord) {
                        return [coord[0], coord[1]]; // Leaflet uses [lat, lng]
                    }), { color: 'blue', weight: 5 }).addTo(map);

                    // Bring polyline to the front
                    currentPolyline.bringToFront();

                    // Fit map to bounds of the route polyline
                    map.fitBounds(currentPolyline.getBounds());
                    console.log('Polyline added to map and bounds fitted.');
                } else {
                    console.error('Route coordinates are undefined or empty.');
                }
            } else {
                console.error('No route found in the API response.');
            }
        })
        .catch(error => {
            console.error('Error fetching or displaying route:', error);
        });
}

// Function to decode polyline
function decodePolyline(encoded) {
    var coordinates = [];
    var current = [0, 0];
    var shift = 0;
    var result = 0;
    var byte = null;
    var latitude_change;
    var longitude_change;

    var factor = Math.pow(10, 5);

    for (var i = 0; i < encoded.length; i++) {
        byte = encoded.charCodeAt(i) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
        if (byte < 0x20) {
            latitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));
            current[0] += latitude_change;
            shift = result = 0;

            i++;
            byte = encoded.charCodeAt(i) - 63;
            result |= (byte & 0x1f) << shift;
            shift += 5;
            while (byte >= 0x20) {
                i++;
                byte = encoded.charCodeAt(i) - 63;
                result |= (byte & 0x1f) << shift;
                shift += 5;
            }
            longitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));
            current[1] += longitude_change;
            shift = result = 0;

            coordinates.push([current[0] / factor, current[1] / factor]);
        }
    }
    return coordinates;
}

        // Toggle popup visibility on button click
        document.getElementById('manageTripBtn').addEventListener('click', function(event) {
            var popup = document.getElementById('tripPopup');
            popup.style.display = (popup.style.display === 'block') ? 'none' : 'block';
            event.stopPropagation(); // Prevent the event from bubbling up

        });

        // Hide the popup when clicking outside of it
        document.addEventListener('click', function(event) {
            var popup = document.getElementById('tripPopup');
            var manageTripBtn = document.getElementById('manageTripBtn');
            if (!popup.contains(event.target) && !manageTripBtn.contains(event.target)) {
                popup.style.display = 'none';
            }
        });

        
// Function to close popup when clicking outside
function closePopup(event) {
    var popup = document.getElementById('popup');
    var nextBtn = document.getElementById('nextBtn');

    // Check if click is outside popup and not on nextBtn
    if (!popup.contains(event.target) && event.target !== nextBtn) {
        popup.style.display = 'none';
        document.body.removeEventListener('click', closePopup);
    }
}

document.getElementById('nextTripBtn').addEventListener('click', function(event) {
    event.stopPropagation(); // Prevent event from bubbling to body

    var requestId = document.getElementById('requestId').value.trim(); // Corrected ID

    if (requestId !== '') {
        fetch('http://localhost/server/get_request_info.php?requestId=' + requestId)
            .then(function(response) {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json(); // Parse JSON response
            })
            .then(function(data) {
                console.log(data); // Debug: log the received data

                document.getElementById('requestId').textContent = "Request ID: " + data.request_id;
                document.getElementById('vehicleType').textContent = "Vehicle Type: " + data.vehicle_type;
                document.getElementById('vehicleRequiredDateTime').textContent = "Vehicle Required Date Time: " + data.vehicle_required_date_time;
                document.getElementById('destination').textContent = "Destination: " + data.destination;
                document.getElementById('whereRequired').textContent = "Where Required: " + data.where_required;
                document.getElementById('mtd').textContent = "MTD: " + data.mtd;

                // Update status dynamically based on fetched data
                var statusElement = document.getElementById('status');
                var statusMap = {
                    1: "MTO",
                    2: "Approver",
                    3: "MTO for assigning vehicle and MTD",
                    4: "Rejected",
                    5: "MTO (Vehicle Alloted)",
                    6: "MTD (DI ongoing)",
                    7: "Security",
                    8: "MTO (Alloting new MT)",
                    9: "Booked Out",
                    10: "Ride Completed"
                };
                statusElement.textContent = "Status: " + (statusMap[data.status] || "Unknown");

                // Show popup
                document.getElementById('popup').style.display = 'block';

                // Show or hide buttons based on status
                var goTripBtn = document.getElementById('goTripBtn');
                var closeTripBtn = document.getElementById('closeTripBtn');

                if (data.status == 6) {
                    goTripBtn.style.display = 'block';
                    closeTripBtn.style.display = 'none';
                    diCheckboxContainer.style.display = 'block';

                } else if (data.status == 9) {
                    goTripBtn.style.display = 'none';
                    closeTripBtn.style.display = 'block';
                    diCheckboxContainer.style.display = 'none';

                } else {
                    goTripBtn.style.display = 'none';
                    closeTripBtn.style.display = 'none';
                    diCheckboxContainer.style.display = 'none';
                }

                // Enable Go Trip button when checkbox is checked
                var diCheckbox = document.getElementById('diCheckbox');
                goTripBtn.disabled = !diCheckbox.checked;

                diCheckbox.addEventListener('change', function() {
                    goTripBtn.disabled = !diCheckbox.checked;
                });

                // Add event listener to close popup when clicking outside
                document.body.addEventListener('click', closePopup);

                // Prevent closing the Manage Trip container when clicking Next
                document.getElementById('nextTripBtn').addEventListener('click', function(event) {
                    event.stopPropagation(); // Prevent event from bubbling to body
                });

                // Add click event for Go Trip button
                goTripBtn.addEventListener('click', function() {
                    if (diCheckbox.checked) {
                        fetch('http://localhost/server/update_status.php', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ request_id: requestId, status: 9 }) // Update status to 9
                        })
                            .then(function(response) {
                                if (!response.ok) {
                                    throw new Error('Network response was not ok');
                                }
                                return response.json();
                            })
                            .then(function(data) {
                                if (data.success) {
                                    alert('Status updated successfully to Booked Out');
                                    goTripBtn.style.display = 'none';
                                    closeTripBtn.style.display = 'block';
                                } else {
                                    alert('Error updating status: ' + data.error);
                                }

                                // Close popup after action
                                document.getElementById('popup').style.display = 'none';
                            })
                            .catch(function(error) {
                                console.error('Fetch error:', error); // Log fetch error
                            });
                    }
                });

                // Add click event for Close Trip button
                closeTripBtn.addEventListener('click', function() {
                    fetch('http://localhost/server/update_status.php', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ request_id: requestId, status: 11 }) // Update status to 11
                    })
                        .then(function(response) {
                            if (!response.ok) {
                                throw new Error('Network response was not ok');
                            }
                            return response.json();
                        })
                        .then(function(data) {
                            if (data.success) {
                                alert('Trip closed successfully');
                            } else {
                                alert('Error closing trip: ' + data.error);
                            }

                            // Close popup after action
                            document.getElementById('popup').style.display = 'none';
                        })
                        .catch(function(error) {
                            console.error('Fetch error:', error); // Log fetch error
                        });
                });
            })
            .catch(function(error) {
                console.error('Fetch error:', error); // Log fetch error
            });
    } else {
        alert('Please enter a Request ID.');
    }
});

                
        


});
    

//     let globalMarkers = [];

//     // Fetch coordinates every 10 seconds
//     setInterval(fetchCoordinates, 5000);

//     const popup = document.getElementById('popup');
//     const nextBtn = document.getElementById('nextBtn');
//     const goBtn = document.getElementById('goBtn');
//     const tripBtn = document.getElementById('tripBtn');
//     const closeTripBtn = document.getElementById('closeTripBtn');
//     const vehicleIdInput = document.getElementById('vehicleId');
//     const requestIdInput = document.getElementById('requestId');
//     const requestIdLabel = document.getElementById('requestIdLabel');
//     const tripContent = document.getElementById('tripContent');
//     const tripVehicleIdSpan = document.getElementById('tripVehicleId');
//     const tripRequestIdSpan = document.getElementById('tripRequestId');

//     document.addEventListener('click', hideTripInfo);
    
//     let currentVehicleId = null;
//     let currentRequestId = null;
//     let tripActive = false;
//     let isFirstAttempt = true; // Flag to track the first attempt
    
//     // Event listener for the "Manage Trip" button
//     tripBtn.addEventListener('click', () => {
//         togglePopup(true); // Display the popup
//     });
    
//     // Function to toggle popup visibility
//     function togglePopup(show) {
//         if (show) {
//             popup.style.display = 'block';
    
//             // Calculate position relative to tripBtn
//             const tripBtnRect = tripBtn.getBoundingClientRect();
//             const popupRect = popup.getBoundingClientRect();
//             const rightOffset = tripBtnRect.right - popupRect.width;
            
//             popup.style.top = `${tripBtnRect.bottom + 10}px`; // Adjust 10px or as needed
//             popup.style.left = `${rightOffset}px`;
    
//             // Determine whether to show only Vehicle ID or both Vehicle ID and Request ID
//             if (isFirstAttempt) {
//                 showVehicleIdForm();
//             } else {
//                 showRequestForm();
//             }
    
//             // Add event listener to close popup when clicking outside
//             document.addEventListener('click', closePopupOutside);
//         } else {
//             popup.style.display = 'none';
//             document.removeEventListener('click', closePopupOutside);
//             hideTripInfo(); // Hide trip info when closing popup
//             resetPopup(); // Reset popup state
//         }
//     }
    
//     // Function to close popup when clicking outside
//     function closePopupOutside(event) {
//         if (!popup.contains(event.target) && event.target !== tripBtn) {
//             togglePopup(false);
//         }
//         // Also hide trip info when clicking outside
//         if (!tripContent.contains(event.target)) {
//             hideTripInfo();
//         }
//     }
    
//     // Event listener for the "Next" button in the popup
//     nextBtn.addEventListener('click', () => {
//         const vehicleId = vehicleIdInput.value.trim();
    
//         if (vehicleId) {
//             checkTripState(vehicleId);
//         } else {
//             alert('Please enter Vehicle ID.');
//         }
//     });
    
//     // Function to check trip state based on vehicle ID
//     function checkTripState(vehicleId) {
//         fetch(`http://192.168.103.78:8000/check_trip_state?vehicleId=${vehicleId}`)
//             .then(response => {
//                 if (!response.ok) {
//                     throw new Error('Network response was not ok');
//                 }
//                 return response.json();
//             })
//             .then(data => {
//                 console.log('Response from server:', data);
//                 if (data.available === true) {
//                     currentVehicleId = vehicleId;
//                     currentRequestId = data.requestId; // Assuming server returns the current request ID
//                     showTripInfo(currentVehicleId, currentRequestId);
//                 } else {
//                     currentVehicleId = vehicleId;
//                     if (isFirstAttempt) {
//                         isFirstAttempt = false;
//                     }
//                     showRequestForm();
//                 }
//             })
//             .catch(error => {
//                 console.error('Error checking trip state:', error);
//                 alert('Failed to check trip state.');
//             });
//     }
    
//     // Function to show only Vehicle ID input form
//     function showVehicleIdForm() {
//         vehicleIdInput.style.display = 'block';
//         requestIdLabel.style.display = 'none'; // Hide request ID label
//         requestIdInput.style.display = 'none'; // Hide request ID input
//         nextBtn.style.display = 'block'; // Display next button
//         goBtn.style.display = 'none'; // Hide go button
//     }
    
//     // Function to show request ID input form
//     function showRequestForm() {
//         vehicleIdInput.style.display = 'block';
//         requestIdLabel.style.display = 'block'; // Display request ID label
//         requestIdInput.style.display = 'block'; // Display request ID input
//         nextBtn.style.display = 'none'; // Hide next button
//         goBtn.style.display = 'block'; // Display go button
//     }
    
//     // Event listener for the "Go" button in the popup
//     goBtn.addEventListener('click', () => {
//         const requestId = requestIdInput.value.trim();
    
//         if (requestId) {
//             currentRequestId = requestId;
//             tripActive = true;
//             updateTripState();
//         } else {
//             alert('Please enter Request ID.');
//         }
//     });
    
//     // Function to update trip state on the server
//     function updateTripState() {
//         const dataToSend = {
//             vehicleId: currentVehicleId,
//             requestId: currentRequestId,
//             tripActive: tripActive
//         };
    
//         console.log('Updating trip state:', dataToSend);
    
//         fetch('http://192.168.103.78:8000/update_trip_state', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json'
//             },
//             body: JSON.stringify(dataToSend)
//         })
//         .then(response => {
//             if (!response.ok) {
//                 throw new Error('Network response was not ok');
//             }
//             return response.json();
//         })
//         .then(responseData => {
//             console.log('Server Response:', responseData);
//             if (responseData.status === 'success') {
//                 console.log('Trip state updated successfully');
//                 updateUI();
//             } else {
//                 console.error('Error from server:', responseData.message);
//             }
//         })
//         .catch(error => console.error('Error updating trip state:', error));
//     }
    
//     // Function to update the UI based on the trip state
//     function updateUI() {
//         if (tripActive) {
//             togglePopup(false);
//             showTripInfo(currentVehicleId, currentRequestId);
//         }
//     }
    
//     // Function to show trip information
//     function showTripInfo(vehicleId, requestId) {
//         tripVehicleIdSpan.innerText = vehicleId;
//         tripRequestIdSpan.innerText = requestId;
//         tripContent.style.display = 'block';
//         closeTripBtn.style.display = 'block';
//     }
    
//     // Function to hide trip information
//     function hideTripInfo() {
//         tripContent.style.display = 'none';
//         closeTripBtn.style.display = 'none';
//     }
    
//     // Event listener for the "Close Trip" button
//     closeTripBtn.addEventListener('click', () => {
//         tripActive = false;
//         updateTripState();
//         hideTripInfo();
//     });


    
//     // Function to reset popup state
//     function resetPopup() {
//         isFirstAttempt = true;
//         vehicleIdInput.value = '';
//         requestIdInput.value = '';
//         vehicleIdInput.style.display = 'block'; // Always show Vehicle ID input initially
//         requestIdLabel.style.display = 'none'; // Hide request ID label initially
//         requestIdInput.style.display = 'none'; // Hide request ID input initially
//         nextBtn.style.display = 'none'; // Hide next button initially
//         goBtn.style.display = 'none'; // Hide go button initially
//     }
    
//     document.addEventListener('DOMContentLoaded', () => {
//         hideTripInfo();
//     });             
    

//     //fetch coordinate final

// // Global array to store markers


// function fetchCoordinates() {
//     fetch('http://192.168.103.78:8000/get_coords')
//         .then(response => {
//             if (!response.ok) {
//                 throw new Error('Network response was not ok');
//             }
//             return response.json();
//         })
//         .then(data => {
//             if (data.coordinates && data.coordinates.length > 0) {
//                 // Iterate through each coordinate
//                 data.coordinates.forEach(coord => {
//                     const lat = coord.lat;
//                     const lng = coord.lng;
//                     const vehicleId = coord.ID;

//                     // Check if marker for this vehicleId already exists
//                     let existingMarker = globalMarkers.find(marker => marker.vehicleId === vehicleId);

//                     if (existingMarker) {
//                         // Update existing marker position
//                         existingMarker.marker.setLatLng([lat, lng]);
//                     } else {
//                         // Create a new marker and add it to the map
//                         const marker = L.marker([lat, lng], { icon: markerIcon })
//                             .bindPopup(`MT Vehicle ID-${vehicleId}`).openPopup();
//                         marker.addTo(map);

//                         // Store the marker in globalMarkers array
//                         globalMarkers.push({ vehicleId: vehicleId, marker: marker });
//                     }
//                 });

//                 // Remove markers not present in the current data
//                 globalMarkers = globalMarkers.filter(markerObj => {
//                     const found = data.coordinates.some(coord => coord.ID === markerObj.vehicleId);
//                     if (!found) {
//                         map.removeLayer(markerObj.marker);
//                     }
//                     return found;
//                 });
//             } else {
//                 console.error('No coordinates found');
//             }
//         })
//         .catch(error => console.error('Error fetching coordinates:', error));
// }


