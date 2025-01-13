<?php
require_once 'config.php';

// Create friend_requests table
$sql = "CREATE TABLE IF NOT EXISTS friend_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES students(id),
    FOREIGN KEY (receiver_id) REFERENCES students(id),
    UNIQUE KEY unique_request (sender_id, receiver_id)
)";

if ($conn->query($sql)) {
    echo "friend_requests table created successfully\n";
} else {
    echo "Error creating table: " . $conn->error . "\n";
}

$conn->close();
?>
