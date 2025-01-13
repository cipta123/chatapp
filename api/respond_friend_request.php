<?php
require_once 'config.php';

header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: *");

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['requestId']) || !isset($data['response']) || !isset($data['userId'])) {
        echo json_encode(['success' => false, 'message' => 'Missing required fields']);
        exit;
    }

    $requestId = $conn->real_escape_string($data['requestId']);
    $response = $conn->real_escape_string($data['response']); // 'accepted' or 'rejected'
    $userId = $conn->real_escape_string($data['userId']);

    // Verify the request exists and belongs to this user
    $sql = "SELECT * FROM friend_requests WHERE id = '$requestId' AND receiver_id = '$userId' AND status = 'pending'";
    $result = $conn->query($sql);
    
    if ($result->num_rows === 0) {
        echo json_encode(['success' => false, 'message' => 'Friend request not found']);
        exit;
    }

    $request = $result->fetch_assoc();

    // Update request status
    $sql = "UPDATE friend_requests SET status = '$response' WHERE id = '$requestId'";
    
    if ($conn->query($sql)) {
        if ($response === 'accepted') {
            // Create a new conversation for these users
            $sql = "INSERT INTO conversations (created_at, updated_at) VALUES (NOW(), NOW())";
            if ($conn->query($sql)) {
                $conversationId = $conn->insert_id;
                
                // Add both users to the conversation
                $sql = "INSERT INTO conversation_participants (conversation_id, student_id) VALUES 
                        ('$conversationId', '{$request['sender_id']}'),
                        ('$conversationId', '{$request['receiver_id']}')";
                
                if ($conn->query($sql)) {
                    echo json_encode([
                        'success' => true, 
                        'message' => 'Friend request accepted',
                        'conversationId' => $conversationId
                    ]);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Failed to create conversation']);
                }
            } else {
                echo json_encode(['success' => false, 'message' => 'Failed to create conversation']);
            }
        } else {
            echo json_encode(['success' => true, 'message' => 'Friend request rejected']);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to update request']);
    }
}

$conn->close();
?>
