<?php
require_once 'db_connection.php';
header('Content-Type: application/json');
session_start();

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Not authenticated.']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
    exit;
}

$name  = trim($_POST['name'] ?? '');
$phone = trim($_POST['phone_number'] ?? '');

if (empty($name)) {
    echo json_encode(['success' => false, 'message' => 'Name cannot be empty.']);
    exit;
}

try {
    $stmt = $db->prepare("UPDATE users SET name = ?, phone_number = ? WHERE id_user = ?");
    $stmt->execute([$name, $phone, $_SESSION['user_id']]);

    // Update session name
    $_SESSION['user_name'] = $name;

    echo json_encode(['success' => true, 'message' => 'Profile updated successfully.']);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error.']);
}
