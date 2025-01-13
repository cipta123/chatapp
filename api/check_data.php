<?php
require_once 'config.php';

// Function to check if table has data
function checkTableData($table) {
    global $conn;
    $result = $conn->query("SELECT COUNT(*) as count FROM $table");
    $row = $result->fetch_assoc();
    return $row['count'];
}

// Check tables
$tables = ['students', 'conversations', 'conversation_participants', 'messages'];
$data = [];

foreach ($tables as $table) {
    $count = checkTableData($table);
    $data[$table] = $count;
    echo "$table count: $count\n";
}

// If no data, insert test data
if ($data['students'] == 0) {
    $conn->query("INSERT INTO students (nim, name, password, birthday) VALUES 
        ('12345', 'John Doe', '2000-01-01', '2000-01-01'),
        ('12346', 'Jane Smith', '2000-02-02', '2000-02-02')");
    echo "Added test students\n";
}

if ($data['conversations'] == 0) {
    $conn->query("INSERT INTO conversations (created_at, updated_at) VALUES 
        (NOW(), NOW())");
    $conversationId = $conn->insert_id;
    echo "Added test conversation\n";
    
    // Add participants
    $conn->query("INSERT INTO conversation_participants (conversation_id, student_id) 
        SELECT $conversationId, id FROM students");
    echo "Added conversation participants\n";
    
    // Add test messages
    $conn->query("INSERT INTO messages (conversation_id, sender_id, message_text, created_at) 
        SELECT 
            $conversationId,
            id,
            CONCAT('Test message from ', name),
            NOW()
        FROM students");
    echo "Added test messages\n";
}

// Show current data
echo "\nCurrent Messages:\n";
$result = $conn->query("
    SELECT 
        m.id,
        m.conversation_id,
        s.name as sender_name,
        m.message_text,
        m.created_at
    FROM messages m
    JOIN students s ON m.sender_id = s.id
    ORDER BY m.created_at DESC
");

while ($row = $result->fetch_assoc()) {
    echo json_encode($row, JSON_PRETTY_PRINT) . "\n";
}
?>
