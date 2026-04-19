<?php
session_start();
if (!isset($_SESSION['user_id'])) {
    die("Bạn cần đăng nhập vào Admin panel trước tiên.");
}

require_once 'db.php';
$database = new Database();
$db = $database->getConnection();

$stmt = $db->query("SELECT setting_value FROM settings WHERE setting_key = 'telegram_bot_token'");
$botToken = $stmt->fetchColumn();

if (empty($botToken)) {
    die("Lỗi: Bạn chưa lưu cấu hình Telegram Bot Token trong trang Cấu hình Admin.");
}

// Ensure HTTPS is used for webhook (Telegram requirement)
$protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http";
$host = $_SERVER['HTTP_HOST'];
$webhookUrl = "{$protocol}://{$host}/api/telegram.php";

echo "<h1>Setup Telegram Webhook</h1>";
echo "<p>Đang cố gắng đăng ký URL Webhook sau với Telegram: <b>{$webhookUrl}</b></p>";

$telegramApiUrl = "https://api.telegram.org/bot{$botToken}/setWebhook?url=" . urlencode($webhookUrl);
$response = file_get_contents($telegramApiUrl);

echo "<h3>Kết quả từ Telegram:</h3>";
echo "<pre>" . print_r(json_decode($response, true), true) . "</pre>";

echo "<p><a href='/admin/settings.html'>Quay lại Cấu hình / Admin</a></p>";
?>
