<?php
/**
 * Database Setup Script — Hao Blog
 * Run this once to create all required tables.
 * URL: https://nguyenvanhao.name.vn/api/setup.php
 */
header('Content-Type: application/json; charset=utf-8');
require_once 'config.php';

try {
    $db = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS
    );
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $results = [];

    // 1. Users table
    $db->exec("CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        email VARCHAR(100) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        display_name VARCHAR(100) DEFAULT '',
        avatar_url VARCHAR(500) DEFAULT '',
        role ENUM('admin','editor','viewer') DEFAULT 'admin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    $results[] = "✅ users table";

    // 2. Categories table
    $db->exec("CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        slug VARCHAR(100) NOT NULL UNIQUE,
        description TEXT DEFAULT '',
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    $results[] = "✅ categories table";

    // 3. Posts table
    $db->exec("CREATE TABLE IF NOT EXISTS posts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        excerpt TEXT DEFAULT '',
        content LONGTEXT,
        featured_image VARCHAR(500) DEFAULT '',
        category_id INT DEFAULT NULL,
        is_published TINYINT(1) DEFAULT 0,
        views INT DEFAULT 0,
        published_at TIMESTAMP NULL DEFAULT NULL,
        scheduled_at DATETIME DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    $results[] = "✅ posts table";

    // 4. Images table
    $db->exec("CREATE TABLE IF NOT EXISTS images (
        id INT AUTO_INCREMENT PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        url VARCHAR(500) NOT NULL,
        alt_text VARCHAR(255) DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    $results[] = "✅ images table";

    // 5. Create default admin user (password: admin123)
    $stmt = $db->query("SELECT COUNT(*) as cnt FROM users");
    $count = $stmt->fetch(PDO::FETCH_ASSOC)['cnt'];
    if ($count == 0) {
        $hash = password_hash('admin123', PASSWORD_DEFAULT);
        $db->prepare("INSERT INTO users (username, email, password_hash, display_name, role) VALUES (?, ?, ?, ?, ?)")
           ->execute(['admin', 'admin@nguyenvanhao.name.vn', $hash, 'Admin', 'admin']);
        $results[] = "✅ Default admin user created (username: admin, password: admin123)";
    } else {
        $results[] = "ℹ️ Users already exist, skipped default admin";
    }

    // 6. Insert default categories
    $stmt = $db->query("SELECT COUNT(*) as cnt FROM categories");
    $count = $stmt->fetch(PDO::FETCH_ASSOC)['cnt'];
    if ($count == 0) {
        $cats = [
            ['Digital Marketing', 'digital-marketing', 'Chiến lược marketing số', 1],
            ['AI & Tool', 'ai-tool', 'Công cụ AI và tự động hóa', 2],
            ['Kiến thức', 'kien-thuc', 'Chia sẻ kiến thức hữu ích', 3],
            ['Review', 'review', 'Đánh giá sản phẩm, dịch vụ', 4],
        ];
        $stmt = $db->prepare("INSERT INTO categories (name, slug, description, sort_order) VALUES (?, ?, ?, ?)");
        foreach ($cats as $cat) {
            $stmt->execute($cat);
        }
        $results[] = "✅ Default categories created (4 categories)";
    } else {
        $results[] = "ℹ️ Categories already exist, skipped defaults";
    }

    echo json_encode([
        'success' => true,
        'message' => 'Database setup completed!',
        'results' => $results
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ], JSON_PRETTY_PRINT);
}
?>
