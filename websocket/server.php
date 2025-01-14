<?php
require_once dirname(__DIR__) . '/api/config.php';
require_once 'vendor/autoload.php';

use Ratchet\Server\IoServer;
use Ratchet\Http\HttpServer;
use Ratchet\WebSocket\WsServer;
use React\EventLoop\Factory;
use React\Socket\SecureServer;
use React\Socket\Server;

class ChatServer implements \Ratchet\MessageComponentInterface {
    protected $clients;
    protected $userConnections;
    protected $conn;

    public function __construct() {
        $this->clients = new \SplObjectStorage;
        $this->userConnections = [];
        
        // Database connection
        $this->conn = new mysqli('localhost', 'root', '', 'student_chat_db');
        if ($this->conn->connect_error) {
            die("Connection failed: " . $this->conn->connect_error);
        }
        echo "Chat server started!\n";
    }

    public function onOpen(\Ratchet\ConnectionInterface $conn) {
        $this->clients->attach($conn);
        echo "New connection! ({$conn->resourceId})\n";
    }

    public function onMessage(\Ratchet\ConnectionInterface $from, $msg) {
        $data = json_decode($msg, true);
        echo "Received message: " . $msg . "\n";
        echo "From connection: {$from->resourceId}\n";
        
        switch ($data['type']) {
            case 'register':
                // Remove any existing connections for this user
                foreach ($this->userConnections as $uid => $conn) {
                    if ($conn === $from) {
                        unset($this->userConnections[$uid]);
                        echo "Removed old connection for user $uid\n";
                    }
                }
                
                // Register new connection
                $this->userConnections[$data['userId']] = $from;
                echo "User {$data['userId']} registered with connection {$from->resourceId}\n";
                echo "Current connections: " . print_r(array_keys($this->userConnections), true) . "\n";
                
                // Send any pending friend requests count
                $this->sendPendingRequestsCount($data['userId']);
                
                // Send confirmation back to user
                $from->send(json_encode([
                    'type' => 'register_confirm',
                    'userId' => $data['userId']
                ]));
                break;
                
            case 'friend_request':
                try {
                    $senderId = $data['senderId'];
                    $receiverNim = $data['receiverNim'];
                    
                    // Get receiver info
                    $stmt = $this->conn->prepare("SELECT id, name FROM students WHERE nim = ?");
                    $stmt->bind_param("s", $receiverNim);
                    $stmt->execute();
                    $result = $stmt->get_result();
                    $receiver = $result->fetch_assoc();
                    
                    if ($receiver) {
                        $receiverId = $receiver['id'];
                        
                        // Send notification to receiver if online
                        if (isset($this->userConnections[$receiverId])) {
                            $notificationData = [
                                'type' => 'new_friend_request',
                                'data' => [
                                    'senderId' => $senderId,
                                    'senderName' => $data['senderName']
                                ]
                            ];
                            $this->userConnections[$receiverId]->send(json_encode($notificationData));
                        }
                    }
                } catch (\Exception $e) {
                    echo "Error sending friend request notification: " . $e->getMessage() . "\n";
                }
                break;
                
            case 'message':
                try {
                    // Validate required fields
                    if (!isset($data['senderId']) || !isset($data['conversationId']) || !isset($data['message'])) {
                        echo "Missing required fields for message\n";
                        return;
                    }

                    echo "Processing message from user {$data['senderId']} to conversation {$data['conversationId']}\n";
                    
                    // Store message in database
                    $stmt = $this->conn->prepare("INSERT INTO messages (conversation_id, sender_id, message_text, created_at) VALUES (?, ?, ?, NOW())");
                    $stmt->bind_param("iis", $data['conversationId'], $data['senderId'], $data['message']);
                    
                    if (!$stmt->execute()) {
                        echo "Error storing message: " . $stmt->error . "\n";
                        return;
                    }
                    $messageId = $this->conn->insert_id;
                    echo "Message stored with ID: $messageId\n";

                    // Update conversation timestamp
                    $stmt = $this->conn->prepare("UPDATE conversations SET updated_at = NOW() WHERE id = ?");
                    $stmt->bind_param("i", $data['conversationId']);
                    if (!$stmt->execute()) {
                        echo "Error updating conversation timestamp: " . $stmt->error . "\n";
                    }

                    // Get sender information
                    $stmt = $this->conn->prepare("SELECT name, nim FROM students WHERE id = ?");
                    $stmt->bind_param("i", $data['senderId']);
                    if (!$stmt->execute()) {
                        echo "Error getting sender information: " . $stmt->error . "\n";
                        return;
                    }
                    $senderResult = $stmt->get_result();
                    $sender = $senderResult->fetch_assoc();
                    
                    if (!$sender) {
                        echo "Sender not found\n";
                        return;
                    }

                    // Get all participants in all conversations of the sender
                    $stmt = $this->conn->prepare("
                        SELECT DISTINCT cp.student_id, c.id as conversation_id
                        FROM conversation_participants cp
                        JOIN conversations c ON cp.conversation_id = c.id
                        WHERE cp.student_id IN (
                            SELECT student_id 
                            FROM conversation_participants 
                            WHERE conversation_id IN (
                                SELECT conversation_id 
                                FROM conversation_participants 
                                WHERE student_id = ?
                            )
                        )
                    ");
                    $stmt->bind_param("i", $data['senderId']);
                    $stmt->execute();
                    $participantsResult = $stmt->get_result();
                    
                    // For each participant, get their unread count and last message
                    while ($participant = $participantsResult->fetch_assoc()) {
                        $participantId = $participant['student_id'];
                        
                        // Get unread count for this participant
                        $unreadStmt = $this->conn->prepare("
                            SELECT COUNT(*) as count
                            FROM messages m
                            WHERE m.conversation_id = ?
                            AND m.created_at > COALESCE(
                                (SELECT last_read_at 
                                FROM conversation_participants 
                                WHERE conversation_id = ? 
                                AND student_id = ?),
                                '1970-01-01'
                            )
                            AND m.sender_id != ?
                        ");
                        $unreadStmt->bind_param("iiii", 
                            $participant['conversation_id'],
                            $participant['conversation_id'],
                            $participantId,
                            $participantId
                        );
                        $unreadStmt->execute();
                        $unreadCount = $unreadStmt->get_result()->fetch_assoc()['count'];

                        // Get last message for this conversation
                        $lastMsgStmt = $this->conn->prepare("
                            SELECT m.*, s.name as sender_name
                            FROM messages m
                            JOIN students s ON m.sender_id = s.id
                            WHERE m.conversation_id = ?
                            ORDER BY m.created_at DESC
                            LIMIT 1
                        ");
                        $lastMsgStmt->bind_param("i", $participant['conversation_id']);
                        $lastMsgStmt->execute();
                        $lastMessage = $lastMsgStmt->get_result()->fetch_assoc();

                        // Only send update if we have a valid last message
                        if ($lastMessage && isset($this->userConnections[$participantId])) {
                            $updateData = [
                                'type' => 'conversation_update',
                                'conversation_id' => $participant['conversation_id'],
                                'last_message' => [
                                    'id' => $lastMessage['id'] ?? null,
                                    'text' => $lastMessage['message_text'] ?? '',
                                    'sender_name' => $lastMessage['sender_name'] ?? '',
                                    'created_at' => $lastMessage['created_at'] ?? date('Y-m-d H:i:s')
                                ],
                                'unread_count' => (int)$unreadCount
                            ];
                            
                            try {
                                $this->userConnections[$participantId]->send(json_encode($updateData));
                                echo "Successfully sent update to participant $participantId\n";
                            } catch (\Exception $e) {
                                echo "Error sending update to participant $participantId: " . $e->getMessage() . "\n";
                            }
                        } else {
                            echo "Skipping update for participant $participantId - " . 
                                 (!$lastMessage ? "No last message found" : "No WebSocket connection") . "\n";
                        }
                    }

                } catch (\Exception $e) {
                    echo "Error processing message: " . $e->getMessage() . "\n";
                    echo "Stack trace: " . $e->getTraceAsString() . "\n";
                }
                break;
                
            case 'typing':
                try {
                    // Get conversation participants
                    $stmt = $this->conn->prepare("SELECT student_id FROM conversation_participants WHERE conversation_id = ? AND student_id != ?");
                    $stmt->bind_param("ii", $data['conversationId'], $data['userId']);
                    $stmt->execute();
                    $result = $stmt->get_result();
                    
                    $typingData = [
                        'type' => 'typing',
                        'userId' => $data['userId'],
                        'conversationId' => $data['conversationId']
                    ];

                    // Notify other participants
                    while ($row = $result->fetch_assoc()) {
                        $participantId = $row['student_id'];
                        if (isset($this->userConnections[$participantId])) {
                            $this->userConnections[$participantId]->send(json_encode($typingData));
                        }
                    }
                } catch (\Exception $e) {
                    echo "Error processing typing notification: " . $e->getMessage() . "\n";
                }
                break;
        }
    }

    private function sendPendingRequestsCount($userId) {
        try {
            // Get count of pending requests
            $stmt = $this->conn->prepare("
                SELECT COUNT(*) as count 
                FROM friend_requests 
                WHERE receiver_id = ? AND status = 'pending'
            ");
            $stmt->bind_param("i", $userId);
            $stmt->execute();
            $result = $stmt->get_result();
            $count = $result->fetch_assoc()['count'];
            
            // Send count to user
            if (isset($this->userConnections[$userId])) {
                $this->userConnections[$userId]->send(json_encode([
                    'type' => 'pending_requests_count',
                    'count' => $count
                ]));
            }
        } catch (\Exception $e) {
            echo "Error sending pending requests count: " . $e->getMessage() . "\n";
        }
    }

    public function onClose(\Ratchet\ConnectionInterface $conn) {
        $this->clients->detach($conn);
        
        // Remove from user connections
        foreach ($this->userConnections as $userId => $userConn) {
            if ($userConn === $conn) {
                unset($this->userConnections[$userId]);
                break;
            }
        }
    }

    public function onError(\Ratchet\ConnectionInterface $conn, \Exception $e) {
        echo "An error has occurred: {$e->getMessage()}\n";
        $conn->close();
    }
}

// Run the server
$server = IoServer::factory(
    new HttpServer(
        new WsServer(
            new ChatServer()
        )
    ),
    8080
);

echo "WebSocket server running on port 8080...\n";
$server->run();
