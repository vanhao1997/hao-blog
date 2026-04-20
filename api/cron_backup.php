<?php
/**
 * Automated Database Backup Cron Script
 * Run via cPanel Cron Job:
 * /usr/bin/php /path/to/hao-blog/api/cron_backup.php
 * OR via wget with CRON_SECRET from .env:
 * wget -qO- "https://nguyenvanhao.name.vn/api/cron_backup.php?key=YOUR_SECRET"
 */

// Use centralized CRON_SECRET from config.php
require_once 'config.php';

// Validate key from GET param or CLI arguments
$isCli = (php_sapi_name() === 'cli');
$keyParam = $_GET['key'] ?? '';

// If running in CLI, bypass the key check or pass it as an argument
if (!$isCli && (empty(CRON_SECRET) || $keyParam !== CRON_SECRET)) {
    http_response_code(403);
    die("Unauthorized");
}

require_once 'db.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    
    $export = [
        'metadata' => [
            'generated_at' => date('Y-m-d H:i:s'),
            'type' => 'automated_cron_backup',
            'version' => '1.0'
        ]
    ];
    
    // Export posts
    $stmt = $db->query("SELECT * FROM posts");
    $export['posts'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Export categories
    $stmt = $db->query("SELECT * FROM categories");
    $export['categories'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Export images
    $stmt = $db->query("SELECT * FROM images");
    $export['images'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $export['stats'] = [
        'posts' => count($export['posts']),
        'categories' => count($export['categories']),
        'images' => count($export['images'])
    ];
    
    $json = json_encode($export, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    $filename = 'backup_' . date('Y_m_d_Hi') . '.json';
    $backupDir = __DIR__ . '/../backups';
    $filepath = $backupDir . '/' . $filename;
    
    if (!file_exists($backupDir)) {
        mkdir($backupDir, 0755, true);
        file_put_contents($backupDir . '/.htaccess', "Order Deny,Allow\nDeny from all\n");
    }
    
    if (file_put_contents($filepath, $json) === false) {
        throw new Exception("Lỗi: Không thể ghi file backup vào thư mục. Kiểm tra quyền (chmod 755).");
    }
    
    // Cleanup backups older than 7 days
    $files = glob($backupDir . '/backup_*.json');
    $now = time();
    $deleted = 0;
    
    foreach ($files as $file) {
        if (is_file($file)) {
            if ($now - filemtime($file) >= 7 * 24 * 60 * 60) {
                unlink($file);
                $deleted++;
            }
        }
    }
    
    echo "Backup successful! Saved as {$filename}. Deleted {$deleted} old backups.\n";

} catch (\Exception $e) {
    if (!$isCli) http_response_code(500);
    echo "Error generating backup: " . $e->getMessage() . "\n";
}
?>
