<?php
require_once 'config.php';

// First, let's make sure we have our test users
// $sql = "INSERT IGNORE INTO students (nim, name, password, birthday) VALUES 
//     ('12345', 'John', 'password123', '2000-01-01'),
//     ('12346', 'Cipta', 'password123', '2000-02-02')";
// $conn->query($sql);

// Get the user IDs
$sql = "SELECT id, name FROM students WHERE nim IN ('12345', '67890')";
$result = $conn->query($sql);
$users = [];
while ($row = $result->fetch_assoc()) {
    $users[] = $row;
}

if (count($users) >= 2) {
    // Create a conversation between these users
    $sql = "INSERT INTO conversations (created_at, updated_at) VALUES (NOW(), NOW())";
    $conn->query($sql);
    $conversationId = $conn->insert_id;

    // Add both users to the conversation
    foreach ($users as $user) {
        $sql = "INSERT INTO conversation_participants (conversation_id, student_id) 
                VALUES ($conversationId, {$user['id']})";
        $conn->query($sql);
    }

    // Add some test messages
    $messages = [
        [
            'sender_id' => $users[0]['id'],
            'message' => 'Hi Cipta, how are you?'
        ],
        [
            'sender_id' => $users[1]['id'],
            'message' => 'Hey John! I\'m good, thanks for asking!'
        ],
        [
            'sender_id' => $users[0]['id'],
            'message' => 'Great! Do you want to work on the project together?'
        ]
    ];

    foreach ($messages as $msg) {
        $sql = "INSERT INTO messages (conversation_id, sender_id, message_text, created_at) 
                VALUES ($conversationId, {$msg['sender_id']}, '{$msg['message']}', NOW())";
        $conn->query($sql);
        
        // Update conversation timestamp
        $sql = "UPDATE conversations SET updated_at = NOW() WHERE id = $conversationId";
        $conn->query($sql);
    }

    echo "Test chat created successfully!\n";
    echo "Conversation ID: $conversationId\n";
    echo "Users: \n";
    foreach ($users as $user) {
        echo "- {$user['name']} (ID: {$user['id']})\n";
    }
} else {
    echo "Error: Could not find test users\n";
}

?>
