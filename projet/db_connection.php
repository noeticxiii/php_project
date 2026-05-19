<?php
$host = "127.0.0.1";
$login = "root";
$password = "";
$dbname = "stock"; // Ensure this matches the name you gave your DB in phpMyAdmin!
$charset = "utf8mb4";

$dsn = "mysql:host=$host;dbname=$dbname;charset=$charset";

// Options to make PDO more reliable
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION, // Turns on errors
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,       // Returns data as clean arrays
    PDO::ATTR_EMULATE_PREPARES   => false,                  // Better security
];

try {
    $db = new PDO($dsn, $login, $password, $options);
    // echo "Connected successfully!"; 
} catch (PDOException $e) {
    // In a real project, don't echo the error to the user, log it instead.
    die("Connection failed: " . $e->getMessage());
}
?>