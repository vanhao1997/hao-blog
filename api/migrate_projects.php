<?php
require_once __DIR__ . '/db.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    $query = "
    CREATE TABLE IF NOT EXISTS projects (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        image_url VARCHAR(255),
        project_url VARCHAR(255),
        category VARCHAR(50),
        sort_order INT DEFAULT 0,
        is_published TINYINT(1) DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ";

    $db->exec($query);
    echo "Projects table created successfully or already exists.\n";
} catch(PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
