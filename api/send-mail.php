<?php
/**
 * Send Mail API — Hao Blog
 * Admin-only endpoints for sending emails
 * 
 * Actions:
 *   POST action=reply   — Reply to a contact message
 *   POST action=newsletter — Send newsletter to all subscribers
 *   POST action=test    — Send test email
 */

// Global error handler to prevent empty responses
set_error_handler(function($severity, $message, $file, $line) {
    throw new ErrorException($message, 0, $severity, $file, $line);
});

// Wrap everything in try-catch
try {
    // Start session BEFORE any output
    session_start();
    
    // Now load dependencies  
    require_once __DIR__ . '/db.php';
    require_once __DIR__ . '/mailer.php';
    
    header('Content-Type: application/json');
    
    // Auth check
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(["error" => "Unauthorized"]);
        exit;
    }
    
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(["error" => "Method not allowed"]);
        exit;
    }
    
    $data = json_decode(file_get_contents("php://input"));
    $action = $data->action ?? '';
    
    $database = new Database();
    $db = $database->getConnection();
    
    switch ($action) {
        // =====================
        // REPLY to contact message
        // =====================
        case 'reply':
            $contactId = $data->contact_id ?? null;
            $replyBody = trim($data->body ?? '');
            
            if (!$contactId || !$replyBody) {
                http_response_code(400);
                echo json_encode(["error" => "Thiếu contact_id hoặc nội dung trả lời"]);
                exit;
            }
            
            $stmt = $db->prepare("SELECT name, email, subject FROM contact_submissions WHERE id = ?");
            $stmt->execute([$contactId]);
            $contact = $stmt->fetch();
            
            if (!$contact) {
                http_response_code(404);
                echo json_encode(["error" => "Không tìm thấy tin nhắn"]);
                exit;
            }
            
            $subject = "Re: " . ($contact['subject'] ?: 'Tin nhắn từ nguyenvanhao.name.vn');
            $htmlBody = "
                <p style='margin:0 0 8px;color:#64748b;font-size:14px;'>Xin chào <strong>{$contact['name']}</strong>,</p>
                <div style='line-height:1.7;font-size:15px;color:#334155;margin:16px 0;white-space:pre-wrap;'>" . nl2br(htmlspecialchars($replyBody)) . "</div>
                <p style='margin:24px 0 0;color:#64748b;font-size:14px;'>Trân trọng,<br><strong>" . MAIL_FROM_NAME . "</strong></p>
            ";
            
            $success = Mailer::send($contact['email'], $subject, $htmlBody, MAIL_FROM);
            
            if ($success) {
                $update = $db->prepare("UPDATE contact_submissions SET status = 'replied' WHERE id = ?");
                $update->execute([$contactId]);
                echo json_encode(["success" => true, "message" => "Đã gửi email trả lời đến {$contact['email']}"]);
            } else {
                echo json_encode(["success" => false, "error" => "Gửi email thất bại. Kiểm tra cấu hình mail server."]);
            }
            break;
        
        // =====================
        // NEWSLETTER to all subscribers
        // =====================
        case 'newsletter':
            $subject = trim($data->subject ?? '');
            $body = trim($data->body ?? '');
            
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
            
            set_time_limit(300);
            $results = Mailer::sendBulk($emails, $subject, $htmlBody);
            
            echo json_encode([
                "success" => true,
                "message" => "Đã gửi {$results['sent']}/{$results['sent'] + $results['failed']} email",
                "details" => $results
            ]);
            break;
        
        // =====================
        // TEST email
        // =====================
        case 'test':
            $testTo = trim($data->to ?? MAIL_FROM);
            
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
                echo json_encode(["success" => true, "message" => "Đã gửi test email đến {$testTo}"]);
            } else {
                echo json_encode(["success" => false, "error" => "Gửi email thất bại. Kiểm tra PHP mail() configuration."]);
            }
            break;
        
        default:
            http_response_code(400);
            echo json_encode(["error" => "Action không hợp lệ. Dùng: reply, newsletter, test"]);
    }

} catch (\Throwable $e) {
    // Catch ALL errors including fatal errors
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        "success" => false,
        "error" => "Server error: " . $e->getMessage(),
        "file" => basename($e->getFile()),
        "line" => $e->getLine()
    ]);
}
?>
