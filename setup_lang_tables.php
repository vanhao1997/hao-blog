<?php
// Script to create translation tables
require_once __DIR__ . '/api/db.php';
$database = new Database();
$db = $database->getConnection();

try {
    $db->exec("
        CREATE TABLE IF NOT EXISTS post_translations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            post_id INT NOT NULL,
            lang VARCHAR(10) NOT NULL,
            title VARCHAR(255) NOT NULL,
            excerpt TEXT,
            content LONGTEXT,
            translated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY unique_post_lang (post_id, lang),
            FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");
    echo "Created post_translations table.\n";

    $db->exec("
        CREATE TABLE IF NOT EXISTS category_translations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            category_id INT NOT NULL,
            lang VARCHAR(10) NOT NULL,
            name VARCHAR(100) NOT NULL,
            description TEXT,
            UNIQUE KEY unique_cat_lang (category_id, lang),
            FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");
    echo "Created category_translations table.\n";

} catch (PDOException $e) {
    echo "Error creating tables: " . $e->getMessage() . "\n";
}
?>
