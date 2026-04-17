<?php
/**
 * Migration: Add scheduled_at column to posts table
 * Run this once to add scheduling support.
 */
require_once 'db.php';

$database = new Database();
$db = $database->getConnection();

try {
    // Check if column already exists
    $stmt = $db->query("SHOW COLUMNS FROM posts LIKE 'scheduled_at'");
    if ($stmt->rowCount() === 0) {
        $db->exec("ALTER TABLE posts ADD COLUMN scheduled_at DATETIME DEFAULT NULL AFTER published_at");
        echo json_encode(["success" => true, "message" => "Added scheduled_at column to posts table"]);
    } else {
        echo json_encode(["success" => true, "message" => "Column scheduled_at already exists"]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}
?>
