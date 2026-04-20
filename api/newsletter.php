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
        $input = file_get_contents("php://input");
        $data = json_decode($input);
        
        // Admin: Send Newsletter or Test Mail (requires auth)
        if (isset($data->action)) {
            session_start();
            if (!isset($_SESSION['user_id'])) {
                http_response_code(401);
                echo json_encode(["error" => "Unauthorized"]);
                exit;
            }
            
            if (!file_exists(__DIR__ . '/mailer.php')) {
                echo json_encode(["success" => false, "error" => "Thiếu module mailer"]);
                exit;
            }
            require_once __DIR__ . '/mailer.php';
            
            // ACTION: TEST MAIL
            if ($data->action === 'test_mail') {
                $testTo = isset($data->to) ? trim($data->to) : MAIL_FROM;
                $htmlBody = "
                    <div style='text-align:center;'>
                        <div style='font-size:3rem;margin-bottom:16px;'>✅</div>
                        <h2 style='margin:0 0 12px;color:#0f172a;'>Email đang hoạt động!</h2>
                        <p style='color:#64748b;line-height:1.6;'>
                            Hệ thống gửi email từ <strong>nguyenvanhao.name.vn</strong> đang hoạt động bình thường.<br>
                            Gửi lúc: " . date('d/m/Y H:i:s') . "
                        </p>
                    </div>
                ";
                
                $success = Mailer::send($testTo, 'Test Email - Hao Blog', $htmlBody);
                if ($success) {
                    echo json_encode(["success" => true, "message" => "Đã gửi test email!"]);
                } else {
                    echo json_encode(["success" => false, "error" => "Lỗi cấu hình server mail"]);
                }
                exit;
            }
            
            // ACTION: SEND NEWSLETTER
            if ($data->action === 'send_newsletter') {
            
            $subject = isset($data->subject) ? trim($data->subject) : '';
            $body = isset($data->body) ? trim($data->body) : '';
            
            if (!$subject || !$body) {
                http_response_code(400);
                echo json_encode(["error" => "Thiếu tiêu đề hoặc nội dung newsletter"]);
                exit;
            }
            
            $stmt = $db->query("SELECT email FROM newsletter_subscribers WHERE is_active = 1");
            $subscribers = $stmt->fetchAll();
            
            if (empty($subscribers)) {
                echo json_encode(["success" => false, "error" => "Không có subscriber nào đang active"]);
                exit;
            }
            
            $emails = array_column($subscribers, 'email');
            $htmlBody = "
                <div style='line-height:1.7;font-size:15px;color:#334155;'>" . $body . "</div>
                <hr style='border:none;border-top:1px solid #e2e8f0;margin:24px 0;'>
                <p style='color:#94a3b8;font-size:12px;text-align:center;'>
                    Bạn nhận email này vì đã đăng ký nhận bản tin từ nguyenvanhao.name.vn
                </p>
            ";
            
            if (function_exists('set_time_limit')) {
                @set_time_limit(300);
            }
            
            if (!file_exists(__DIR__ . '/mailer.php')) {
                echo json_encode(["success" => false, "error" => "Thiếu module mailer"]);
                exit;
            }
            require_once __DIR__ . '/mailer.php';
            
            $results = Mailer::sendBulk($emails, $subject, $htmlBody);
            
            echo json_encode([
                "success" => true,
                "message" => "Đã gửi {$results['sent']}/{$results['sent'] + $results['failed']} email",
                "details" => $results
            ]);
            exit;
        }
        }
        
        // Public: Subscribe Newsletter
        $email = isset($data->email) ? trim($data->email) : '';

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
            echo json_encode(["error" => "Database error"]);
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

    case 'DELETE':
        // Admin only
        session_start();
        if (!isset($_SESSION['user_id'])) {
            http_response_code(401);
            echo json_encode(["error" => "Unauthorized"]);
            exit;
        }
        $id = $_GET['id'] ?? null;
        if (!$id) {
            http_response_code(400);
            echo json_encode(["error" => "Missing ID"]);
            exit;
        }
        try {
            $stmt = $db->prepare("DELETE FROM newsletter_subscribers WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(["success" => true, "message" => "Subscribers deleted"]);
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
