<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// Check if request method is GET
if ($_SERVER['REQUEST_METHOD'] == 'GET') {
    // Database connection parameters
    $servername = "localhost";
    $username = "root";
    $password = "";
    $dbname = "mt_tracker";

    try {
        // Create connection
        $conn = new PDO("mysql:host=$servername;dbname=$dbname", $username, $password);
        $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        // Get requestId from GET parameters
        $requestId = isset($_GET['requestId']) ? $_GET['requestId'] : null;

        if ($requestId !== null) {
            // Prepare SQL statement
            $stmt = $conn->prepare("SELECT * FROM pending_requests WHERE request_id = :requestId");
            $stmt->bindParam(':requestId', $requestId, PDO::PARAM_INT);
            $stmt->execute();

            // Check if there is a row matching the requestId
            if ($stmt->rowCount() > 0) {
                // Fetch data as associative array
                $row = $stmt->fetch(PDO::FETCH_ASSOC);

                // Return JSON-encoded data
                echo json_encode($row);
            } else {
                // Return error response if no data found
                http_response_code(404); // Not Found
                echo json_encode(array('error' => 'No data found for requestId'));
            }
        } else {
            // Return error response if requestId is missing
            http_response_code(400); // Bad Request
            echo json_encode(array('error' => 'Request ID is required'));
        }

    } catch (PDOException $e) {
        // Return database connection error response
        http_response_code(500); // Internal Server Error
        echo json_encode(array('error' => 'Database connection failed: ' . $e->getMessage()));
    }

} else {
    // Return error response for unsupported request method
    http_response_code(405); // Method Not Allowed
    echo json_encode(array('error' => 'Method not allowed'));
}
?>
