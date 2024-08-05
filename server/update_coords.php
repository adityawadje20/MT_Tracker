<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

$servername = "localhost";   // Replace with your MySQL server hostname
$username = "root";      // Replace with your MySQL username
$password = "";      // Replace with your MySQL password
$database = "mt_tracker";    // Replace with your MySQL database name

try {
    // Create connection
    $conn = new PDO("mysql:host=$servername;dbname=$database", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Assuming you receive JSON data
    $data = json_decode(file_get_contents('php://input'), true);

    // Debugging: Log received data
    error_log(print_r($data, true));

    if (isset($data['coordinates'])) {
        $coordinates = $data['coordinates'];

        // Prepare and execute statement to insert coordinates into the database
        $stmt = $conn->prepare("INSERT INTO coordinates (request_id, vehicle_id, lat, lng) VALUES (:request_id, :vehicle_id, :lat, :lng)");

        foreach ($coordinates as $coord) {
            // Debugging: Log each coordinate being inserted
            error_log("Inserting: " . print_r($coord, true));

            $stmt->execute(array(
                'request_id' => $coord['request_id'],
                'vehicle_id' => $coord['vehicle_id'],
                'lat' => $coord['lat'],
                'lng' => $coord['lng']
            ));
        }

        // Return success response
        $response = array('success' => true);
        echo json_encode($response);

    } else {
        // Return error response
        $response = array('error' => 'Invalid data received');
        echo json_encode($response);
    }

} catch (PDOException $e) {
    // Return database connection error response
    $response = array('error' => 'Database connection failed: ' . $e->getMessage());
    echo json_encode($response);
}
?>
