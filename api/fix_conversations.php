<?php
require_once 'config.php';

// Remove duplicate conversation participants
$sql = "CREATE TEMPORARY TABLE temp_participants AS
SELECT DISTINCT conversation_id, student_id
FROM conversation_participants;

TRUNCATE TABLE conversation_participants;

INSERT INTO conversation_participants (conversation_id, student_id)
SELECT * FROM temp_participants;

DROP TEMPORARY TABLE temp_participants;";

if ($conn->multi_query($sql)) {
    echo "Duplicate participants removed successfully\n";
} else {
    echo "Error removing duplicates: " . $conn->error . "\n";
}

// Remove duplicate conversations
$sql = "CREATE TEMPORARY TABLE temp_conversations AS
SELECT DISTINCT id, created_at, updated_at
FROM conversations;

TRUNCATE TABLE conversations;

INSERT INTO conversations (id, created_at, updated_at)
SELECT * FROM temp_conversations;

DROP TEMPORARY TABLE temp_conversations;";

if ($conn->multi_query($sql)) {
    echo "Duplicate conversations removed successfully\n";
} else {
    echo "Error removing duplicates: " . $conn->error . "\n";
}

$conn->close();
?>
