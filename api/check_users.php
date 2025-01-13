<?php
require_once 'config.php';

// Check users table
$sql = "SELECT * FROM students";
$result = $conn->query($sql);

echo "Users in database:\n";
while ($row = $result->fetch_assoc()) {
    echo "ID: {$row['id']}, NIM: {$row['nim']}, Name: {$row['name']}, Birthday: {$row['birthday']}\n";
}

// Check conversation participants
$sql = "SELECT cp.*, s.name FROM conversation_participants cp 
        JOIN students s ON cp.student_id = s.id";
$result = $conn->query($sql);

echo "\nConversation participants:\n";
while ($row = $result->fetch_assoc()) {
    echo "Conversation ID: {$row['conversation_id']}, User ID: {$row['student_id']}, Name: {$row['name']}\n";
}

?>
