<?php
header('Content-Type: application/json');
require_once 'db.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    // Add views column
    $sql = "ALTER TABLE posts ADD COLUMN views INT DEFAULT 0";
    $db->exec($sql);
    
    echo json_encode([
        'success' => true,
        'message' => 'Migration successful: views column added.'
    ]);
} catch (\PDOException $e) {
    if (strpos($e->getMessage(), 'Duplicate column name') !== false) {
        echo json_encode(['success' => true, 'message' => 'Migration already applied.']);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}
?>
