<?php
/**
 * Newsletter Subscriber API — Hao Blog
 * Saves email subscribers to DB
 */
header('Content-Type: application/json');
require_once 'db.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

// Auto-create table if not exists
try {
    $db->exec("CREATE TABLE IF NOT EXISTS newsletter_subscribers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        subscribed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_active TINYINT(1) DEFAULT 1
    )");
} catch (\Throwable $e) {
    // Table might already exist
}

switch ($method) {
    case 'POST':
        $data = json_decode(file_get_contents("php://input"));
        $email = trim($data->email ?? '');

        if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode(["error" => "Email không hợp lệ"]);
            exit;
        }

        try {
            $stmt = $db->prepare("INSERT INTO newsletter_subscribers (email) VALUES (?) ON DUPLICATE KEY UPDATE is_active = 1, subscribed_at = NOW()");
            $stmt->execute([$email]);
            echo json_encode(["success" => true, "message" => "Đăng ký thành công!"]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["error" => $e->getMessage()]);
        }
        break;

    case 'GET':
        // Admin: list subscribers (requires auth)
        session_start();
        if (!isset($_SESSION['user_id'])) {
            http_response_code(401);
            echo json_encode(["error" => "Unauthorized"]);
            exit;
        }

        try {
            $stmt = $db->query("SELECT id, email, subscribed_at, is_active FROM newsletter_subscribers ORDER BY subscribed_at DESC");
            $subscribers = $stmt->fetchAll();
            echo json_encode(["data" => $subscribers, "total" => count($subscribers)]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["error" => $e->getMessage()]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(["error" => "Method not allowed"]);
}
?>
