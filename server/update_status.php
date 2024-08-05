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

    // Get JSON data from request
    $data = json_decode(file_get_contents('php://input'), true);

    if (isset($data['request_id']) && isset($data['status'])) {
        $requestId = $data['request_id'];
        $status = $data['status'];

        // Prepare and execute the update statement
        $stmt = $conn->prepare("UPDATE pending_requests SET status = :status WHERE request_id = :request_id");
        $stmt->execute(array(
            'status' => $status,
            'request_id' => $requestId
        ));

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
