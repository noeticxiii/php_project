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

$raw  = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!isset($data['items']) || !is_array($data['items']) || count($data['items']) === 0) {
    echo json_encode(['success' => false, 'message' => 'No items provided.']);
    exit;
}

$userId = $_SESSION['user_id'];
$items  = $data['items'];

// Actual orders table columns:
//   id_order      INT AUTO_INCREMENT PK
//   order_date    DATETIME DEFAULT current_timestamp()
//   status        ENUM('CONFIRMED','CANCELED') DEFAULT 'CONFIRMED'
//   total_amount  DECIMAL(10,2)
//   id_user       INT

try {
    $db->beginTransaction();

    // Verify products exist and compute total from DB prices
    $ids          = array_column($items, 'id_product');
    $placeholders = implode(',', array_fill(0, count($ids), '?'));
    $stmt         = $db->prepare("SELECT id_product, price FROM products WHERE id_product IN ($placeholders)");
    $stmt->execute($ids);
    $dbProducts   = $stmt->fetchAll(PDO::FETCH_KEY_PAIR); // id_product => price

    $total = 0;
    foreach ($items as $item) {
        $pid = $item['id_product'];
        if (!isset($dbProducts[$pid])) {
            $db->rollBack();
            echo json_encode(['success' => false, 'message' => "Product #$pid not found."]);
            exit;
        }
        $total += $dbProducts[$pid] * (int)$item['qty'];
    }

    // Insert the order — using exact column names from the DB
    $stmt = $db->prepare("
        INSERT INTO orders (id_user, total_amount, status, order_date)
        VALUES (?, ?, 'CONFIRMED', NOW())
    ");
    $stmt->execute([$userId, $total]);
    $orderId = $db->lastInsertId();

    // Insert order items
    $stmt = $db->prepare("
        INSERT INTO order_items (id_order, id_product, quantity, price_at_purchase)
        VALUES (?, ?, ?, ?)
    ");
    foreach ($items as $item) {
        $pid       = $item['id_product'];
        $qty       = (int)$item['qty'];
        $unitPrice = $dbProducts[$pid];
        $stmt->execute([$orderId, $pid, $qty, $unitPrice]);
    }

    $db->commit();

    echo json_encode([
        'success'  => true,
        'message'  => 'Order placed successfully!',
        'order_id' => $orderId,
        'total'    => number_format($total, 2)
    ]);

} catch (PDOException $e) {
    $db->rollBack();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
