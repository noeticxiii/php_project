<?php
require_once 'db_connection.php';
header('Content-Type: application/json');
session_start();

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Not authenticated.']);
    exit;
}

$userId = $_SESSION['user_id'];

// Actual orders table columns:
//   id_order      INT PK
//   order_date    DATETIME
//   status        ENUM('CONFIRMED','CANCELED')
//   total_amount  DECIMAL(10,2)
//   id_user       INT

try {
    $stmt = $db->prepare("
        SELECT id_order,
               id_user,
               total_amount  AS total_price,
               status,
               order_date    AS created_at
        FROM orders
        WHERE id_user = ?
        ORDER BY id_order DESC
    ");
    $stmt->execute([$userId]);
    $orders = $stmt->fetchAll();

    // Fetch items for each order
    $itemStmt = $db->prepare("
        SELECT oi.id_order,
               oi.id_product,
               oi.quantity,
               oi.price_at_purchase,
               p.name,
               p.image_url,
               p.description
        FROM order_items oi
        JOIN products p ON oi.id_product = p.id_product
        WHERE oi.id_order = ?
    ");

    foreach ($orders as &$order) {
        $itemStmt->execute([$order['id_order']]);
        $order['items'] = $itemStmt->fetchAll();
    }
    unset($order);

    echo json_encode(['success' => true, 'orders' => $orders]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
