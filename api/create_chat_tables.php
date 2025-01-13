<?php
require_once 'config.php';

// Create conversations table
$sql = "CREATE TABLE IF NOT EXISTS conversations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)";

if ($conn->query($sql) === TRUE) {
    echo "Table conversations created successfully\n";
} else {
    echo "Error creating table conversations: " . $conn->error . "\n";
}

// Create conversation_participants table
$sql = "CREATE TABLE IF NOT EXISTS conversation_participants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conversation_id INT,
    student_id INT,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id),
    FOREIGN KEY (student_id) REFERENCES students(id),
    UNIQUE KEY unique_conversation_participant (conversation_id, student_id)
)";

if ($conn->query($sql) === TRUE) {
    echo "Table conversation_participants created successfully\n";
} else {
    echo "Error creating table conversation_participants: " . $conn->error . "\n";
}

// Create messages table
$sql = "CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conversation_id INT,
    sender_id INT,
    message_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id),
    FOREIGN KEY (sender_id) REFERENCES students(id)
)";

if ($conn->query($sql) === TRUE) {
    echo "Table messages created successfully\n";
} else {
    echo "Error creating table messages: " . $conn->error . "\n";
}

// Add some sample data
$sql = "INSERT INTO conversations (id) VALUES (1)";
if ($conn->query($sql) === TRUE) {
    echo "Sample conversation created\n";
    
    // Add participants to the conversation (using the sample students we created earlier)
    $sql = "INSERT INTO conversation_participants (conversation_id, student_id) 
            SELECT 1, id FROM students LIMIT 2";
    if ($conn->query($sql) === TRUE) {
        echo "Sample participants added\n";
        
        // Add some sample messages
        $sql = "INSERT INTO messages (conversation_id, sender_id, message_text) 
                SELECT 
                    1,
                    s.id,
                    CASE 
                        WHEN s.nim = '12345' THEN 'Hey, how are you?'
                        ELSE 'I\'m good, thanks! How about you?'
                    END
                FROM students s
                WHERE s.nim IN ('12345', '67890')";
        if ($conn->query($sql) === TRUE) {
            echo "Sample messages added\n";
        } else {
            echo "Error adding sample messages: " . $conn->error . "\n";
        }
    } else {
        echo "Error adding sample participants: " . $conn->error . "\n";
    }
} else {
    echo "Error creating sample conversation: " . $conn->error . "\n";
}

// Create API endpoint to get messages
$sql = "CREATE OR REPLACE VIEW conversation_messages_view AS
SELECT 
    m.id,
    m.conversation_id,
    m.message_text,
    m.created_at,
    m.is_deleted,
    s.nim as sender_nim,
    s.name as sender_name
FROM messages m
JOIN students s ON m.sender_id = s.id
WHERE m.is_deleted = FALSE
ORDER BY m.created_at DESC";

if ($conn->query($sql) === TRUE) {
    echo "Messages view created successfully\n";
} else {
    echo "Error creating messages view: " . $conn->error . "\n";
}

$conn->close();
?>
