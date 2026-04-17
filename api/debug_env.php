<?php
// Tạm thời bật hiện lỗi để DEBUG
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require_once 'config.php';

echo "<pre>";
echo "<h2>DEBUG THÔNG TIN KẾT NỐI:</h2>\n";
echo "HOST: " . htmlspecialchars(DB_HOST) . "\n";
echo "NAME: " . htmlspecialchars(DB_NAME) . "\n";
echo "USER: " . htmlspecialchars(DB_USER) . "\n";
echo "PASS: (Đã ẩn độ dài " . strlen(DB_PASS) . " ký tự)\n\n";

try {
    echo "Đang thử kết nối...\n";
    $conn = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "<h3 style='color:green'>KẾT NỐI THÀNH CÔNG!</h3>";
} catch(PDOException $e) {
    echo "<h3 style='color:red'>KẾT NỐI THẤT BẠI:</h3>";
    echo $e->getMessage() . "\n";
}
echo "</pre>";
?>
