<?php
require_once 'config.php';

header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: *");

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['username']) || !isset($data['password'])) {
        echo json_encode(['success' => false, 'message' => 'Missing username or password']);
        exit;
    }

    $nim = $conn->real_escape_string($data['username']);
    $birthday = $conn->real_escape_string($data['password']);

    $sql = "SELECT id, nim, name, birthday FROM students WHERE nim = '$nim' AND birthday = '$birthday'";
    $result = $conn->query($sql);
    
    if ($result->num_rows > 0) {
        $user = $result->fetch_assoc();
        echo json_encode([
            'success' => true,
            'message' => 'Login successful',
            'user' => [
                'id' => $user['id'],
                'nim' => $user['nim'],
                'name' => $user['name']
            ]
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Invalid NIM or birthday']);
    }
}

$conn->close();
?>
