<?php
require_once 'db_connection.php';
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

try {
    $stmt = $db->query("
        SELECT p.*, c.type AS category
        FROM products p
        LEFT JOIN categories c ON p.id_category = c.id_category
    ");
    $products = $stmt->fetchAll();
    echo json_encode($products);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Database query failed"]);
}
