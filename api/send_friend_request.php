<?php
require_once 'config.php';

header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: *");

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['senderId']) || !isset($data['receiverNim'])) {
        echo json_encode(['success' => false, 'message' => 'Missing required fields']);
        exit;
    }

    $senderId = $conn->real_escape_string($data['senderId']);
    $receiverNim = $conn->real_escape_string($data['receiverNim']);

    // Get receiver ID from NIM
    $sql = "SELECT id FROM students WHERE nim = '$receiverNim'";
    $result = $conn->query($sql);
    
    if ($result->num_rows === 0) {
        echo json_encode(['success' => false, 'message' => 'Student with this NIM not found']);
        exit;
    }

    $receiver = $result->fetch_assoc();
    $receiverId = $receiver['id'];

    // Check if sender is trying to add themselves
    if ($senderId == $receiverId) {
        echo json_encode(['success' => false, 'message' => 'You cannot add yourself']);
        exit;
    }

    // Check if request already exists
    $sql = "SELECT * FROM friend_requests 
            WHERE (sender_id = '$senderId' AND receiver_id = '$receiverId')
            OR (sender_id = '$receiverId' AND receiver_id = '$senderId')";
    $result = $conn->query($sql);
    
    if ($result->num_rows > 0) {
        $request = $result->fetch_assoc();
        if ($request['status'] === 'pending') {
            echo json_encode(['success' => false, 'message' => 'Friend request already sent']);
        } else if ($request['status'] === 'accepted') {
            echo json_encode(['success' => false, 'message' => 'You are already friends']);
        } else {
            // If rejected, allow new request
            $sql = "INSERT INTO friend_requests (sender_id, receiver_id) 
                    VALUES ('$senderId', '$receiverId')";
            if ($conn->query($sql)) {
                echo json_encode(['success' => true, 'message' => 'Friend request sent']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Failed to send request']);
            }
        }
        exit;
    }

    // Send new request
    $sql = "INSERT INTO friend_requests (sender_id, receiver_id) 
            VALUES ('$senderId', '$receiverId')";
    
    if ($conn->query($sql)) {
        echo json_encode(['success' => true, 'message' => 'Friend request sent']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to send request']);
    }
}

$conn->close();
?>
