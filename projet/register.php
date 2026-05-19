<?php
require_once 'db_connection.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name = trim($_POST['name'] ?? '');
    $phone = trim($_POST['phone_number'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';

    // Validate required fields
    if (empty($name) || empty($email) || empty($password)) {
        echo json_encode(['success' => false, 'message' => 'Please fill all required fields.']);
        exit;
    }

    // Securely hash the password
    $password_hash = password_hash($password, PASSWORD_DEFAULT);

    try {
        $stmt = $db->prepare("INSERT INTO users (name, phone_number, email, password_hash) VALUES (?, ?, ?, ?)");
        $stmt->execute([$name, $phone, $email, $password_hash]);
        
        echo json_encode(['success' => true, 'message' => 'Registration successful! You can now log in.']);
    } catch (PDOException $e) {
        if ($e->getCode() == 23000) { // Error code for unique constraint violation (duplicate email)
            echo json_encode(['success' => false, 'message' => 'This email is already registered.']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
        }
    }
}
?>