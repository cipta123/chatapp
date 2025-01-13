<?php
$host = 'localhost';
$user = 'root';
$pass = '';

$conn = new mysqli($host, $user, $pass);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Create database
$sql = "CREATE DATABASE IF NOT EXISTS student_chat_db";
if ($conn->query($sql) === TRUE) {
    echo "Database created successfully\n";
} else {
    echo "Error creating database: " . $conn->error . "\n";
}

// Select database
$conn->select_db("student_chat_db");

// Create students table
$sql = "CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nim VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    birthday DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)";

if ($conn->query($sql) === TRUE) {
    echo "Table students created successfully\n";
} else {
    echo "Error creating table: " . $conn->error . "\n";
}

// Insert sample data
$sql = "INSERT INTO students (nim, name, birthday) VALUES
    ('12345', 'John Doe', '2000-01-01'),
    ('67890', 'Jane Smith', '2000-05-15')
ON DUPLICATE KEY UPDATE name=VALUES(name), birthday=VALUES(birthday)";

if ($conn->query($sql) === TRUE) {
    echo "Sample data inserted successfully\n";
} else {
    echo "Error inserting sample data: " . $conn->error . "\n";
}

$conn->close();
?>
