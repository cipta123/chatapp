<?php
require_once 'config.php';

header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: *");

// Get messages for a conversation
function getMessages($conversationId) {
    global $conn;
    
    $conversationId = $conn->real_escape_string($conversationId);
    
    $sql = "SELECT 
                m.id,
                m.conversation_id,
                m.sender_id,
                m.message_text as text,
                m.created_at,
                s.name as sender_name,
                s.nim as sender_nim
            FROM messages m
            JOIN students s ON m.sender_id = s.id
            WHERE m.conversation_id = '$conversationId' 
            ORDER BY m.created_at ASC";
    
    $result = $conn->query($sql);
    
    if (!$result) {
        error_log("SQL Error: " . $conn->error);
        return [];
    }
    
    $messages = [];
    if ($result->num_rows > 0) {
        while($row = $result->fetch_assoc()) {
            $messages[] = $row;
        }
    }
    
    return $messages;
}

// Send a new message
function sendMessage($conversationId, $senderId, $messageText) {
    global $conn;
    
    $conversationId = $conn->real_escape_string($conversationId);
    $senderId = $conn->real_escape_string($senderId);
    $messageText = $conn->real_escape_string($messageText);
    
    $sql = "INSERT INTO messages (conversation_id, sender_id, message_text) 
            VALUES ('$conversationId', '$senderId', '$messageText')";
    
    if ($conn->query($sql) === TRUE) {
        return [
            'success' => true,
            'message_id' => $conn->insert_id
        ];
    } else {
        return [
            'success' => false,
            'error' => $conn->error
        ];
    }
}

// Get conversations for a user
function getConversations($studentId) {
    global $conn;
    
    $studentId = $conn->real_escape_string($studentId);
    
    $sql = "SELECT DISTINCT
        c.id,
        c.created_at,
        c.updated_at,
        s2.name as other_participant_name,
        m.message_text as last_message,
        m.created_at as last_message_time,
        (
            SELECT COUNT(*)
            FROM messages msg
            WHERE msg.conversation_id = c.id
            AND msg.created_at > COALESCE(cp.last_read_at, '1970-01-01')
            AND msg.sender_id != '$studentId'
        ) as unread_count
    FROM conversations c
    JOIN conversation_participants cp ON c.id = cp.conversation_id
    JOIN conversation_participants cp2 ON c.id = cp2.conversation_id AND cp2.student_id != cp.student_id
    JOIN students s2 ON cp2.student_id = s2.id
    LEFT JOIN messages m ON m.id = (
        SELECT id
        FROM messages
        WHERE conversation_id = c.id
        ORDER BY created_at DESC
        LIMIT 1
    )
    WHERE cp.student_id = '$studentId'
    ORDER BY COALESCE(m.created_at, c.created_at) DESC";
    
    $result = $conn->query($sql);
    
    if (!$result) {
        error_log("SQL Error: " . $conn->error);
        return [];
    }
    
    $conversations = [];
    if ($result->num_rows > 0) {
        while($row = $result->fetch_assoc()) {
            $conversations[] = $row;
        }
    }
    
    return $conversations;
}

// Add new function to mark messages as read
function markConversationAsRead($conversationId, $userId) {
    global $conn;
    
    $conversationId = $conn->real_escape_string($conversationId);
    $userId = $conn->real_escape_string($userId);
    
    $sql = "UPDATE conversation_participants 
            SET last_read_at = NOW() 
            WHERE conversation_id = '$conversationId' 
            AND student_id = '$userId'";
    
    return $conn->query($sql);
}

// Handle API requests
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (isset($_GET['conversation_id'])) {
        // Get messages for a conversation
        $messages = getMessages($_GET['conversation_id']);
        echo json_encode([
            'success' => true,
            'messages' => $messages
        ]);
    } elseif (isset($_GET['student_id'])) {
        // Get conversations for a user
        $conversations = getConversations($_GET['student_id']);
        echo json_encode([
            'success' => true,
            'conversations' => $conversations
        ]);
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (isset($data['conversation_id']) && isset($data['sender_id']) && isset($data['message'])) {
        // Send a new message
        $result = sendMessage($data['conversation_id'], $data['sender_id'], $data['message']);
        echo json_encode($result);
    } elseif (isset($data['conversation_id']) && isset($data['user_id']) && isset($data['mark_read'])) {
        // Mark conversation as read
        $result = markConversationAsRead($data['conversation_id'], $data['user_id']);
        echo json_encode(['success' => $result]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Missing required fields']);
    }
}
?>
