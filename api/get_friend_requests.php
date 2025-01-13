<?php
require_once 'config.php';

header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: *");

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (!isset($_GET['userId'])) {
        echo json_encode(['success' => false, 'message' => 'User ID is required']);
        exit;
    }

    $userId = $conn->real_escape_string($_GET['userId']);

    // Get received requests
    $sql = "SELECT 
                fr.id as request_id,
                fr.sender_id,
                fr.created_at,
                fr.status,
                s.name as sender_name,
                s.nim as sender_nim
            FROM friend_requests fr
            JOIN students s ON fr.sender_id = s.id
            WHERE fr.receiver_id = '$userId' AND fr.status = 'pending'
            ORDER BY fr.created_at DESC";
    
    $result = $conn->query($sql);
    
    $receivedRequests = [];
    if ($result->num_rows > 0) {
        while($row = $result->fetch_assoc()) {
            $receivedRequests[] = $row;
        }
    }

    // Get sent requests
    $sql = "SELECT 
                fr.id as request_id,
                fr.receiver_id,
                fr.created_at,
                fr.status,
                s.name as receiver_name,
                s.nim as receiver_nim
            FROM friend_requests fr
            JOIN students s ON fr.receiver_id = s.id
            WHERE fr.sender_id = '$userId' AND fr.status = 'pending'
            ORDER BY fr.created_at DESC";
    
    $result = $conn->query($sql);
    
    $sentRequests = [];
    if ($result->num_rows > 0) {
        while($row = $result->fetch_assoc()) {
            $sentRequests[] = $row;
        }
    }

    echo json_encode([
        'success' => true,
        'received' => $receivedRequests,
        'sent' => $sentRequests
    ]);
}

$conn->close();
?>
