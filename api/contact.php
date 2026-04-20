<?php
/**
 * Contact Submissions API — Hao Blog
 * Stores contact form submissions from public site into DB
 */
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once 'db.php';

// Load mailer for notifications (non-fatal if missing)
$mailerLoaded = false;
if (file_exists(__DIR__ . '/mailer.php')) {
    require_once 'mailer.php';
    $mailerLoaded = true;
}

$database = new Database();
$db = $database->getConnection();

// Auto-create table if not exists
try {
    $db->exec("CREATE TABLE IF NOT EXISTS contact_submissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        subject VARCHAR(500) DEFAULT '',
        message TEXT NOT NULL,
        status ENUM('new','read','replied') DEFAULT 'new',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )");
} catch (\Throwable $e) {
    // Table might already exist
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'POST':
        $data = json_decode(file_get_contents("php://input"));
        $name = trim($data->name ?? '');
        $email = trim($data->email ?? '');
        $subject = trim($data->subject ?? '');
        $message = trim($data->message ?? '');

        if (!$name || !$email || !$message) {
            http_response_code(400);
            echo json_encode(["error" => "Vui lòng điền đầy đủ họ tên, email và tin nhắn"]);
            exit;
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode(["error" => "Email không hợp lệ"]);
            exit;
        }

        try {
            $stmt = $db->prepare("INSERT INTO contact_submissions (name, email, subject, message) VALUES (?, ?, ?, ?)");
            $stmt->execute([
                htmlspecialchars($name),
                htmlspecialchars($email),
                htmlspecialchars($subject),
                htmlspecialchars($message)
            ]);
            
            // Send email notification to admin
            if ($mailerLoaded) {
                try {
                    Mailer::notifyNewContact($name, $email, $subject, $message);
                } catch (\Throwable $e) {
                    // Non-fatal: log but still return success
                    error_log("Mailer notification failed: " . $e->getMessage());
                }
            }
            
            echo json_encode(["success" => true, "message" => "Tin nhắn đã được gửi thành công!"]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["error" => $e->getMessage()]);
        }
        break;

    case 'GET':
        // Admin: list submissions (requires auth)
        session_start();
        if (!isset($_SESSION['user_id'])) {
            http_response_code(401);
            echo json_encode(["error" => "Unauthorized"]);
            exit;
        }

        try {
            $stmt = $db->query("SELECT id, name, email, subject, message, status, created_at FROM contact_submissions ORDER BY created_at DESC");
            $submissions = $stmt->fetchAll();
            $newCount = 0;
            foreach ($submissions as $s) {
                if ($s['status'] === 'new') $newCount++;
            }
            echo json_encode(["data" => $submissions, "total" => count($submissions), "new_count" => $newCount]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["error" => $e->getMessage()]);
        }
        break;

    case 'PUT':
        // Admin update status or send reply
        session_start();
        if (!isset($_SESSION['user_id'])) {
            http_response_code(401);
            echo json_encode(["error" => "Unauthorized"]);
            exit;
        }
        
        $input = file_get_contents('php://input');
        $data = json_decode($input);
        
        // Check if this is a reply action
        if (isset($data->action) && $data->action === 'reply') {
            $id = $data->contact_id ?? null;
            $replyBody = trim($data->body ?? '');
            
            if (!$id || !$replyBody) {
                http_response_code(400);
                echo json_encode(["error" => "Thiếu contact_id hoặc nội dung"]);
                exit;
            }
            
            $stmt = $db->prepare("SELECT name, email, subject FROM contact_submissions WHERE id = ?");
            $stmt->execute([$id]);
            $contact = $stmt->fetch();
            
            if (!$contact) {
                http_response_code(404);
                echo json_encode(["error" => "Không tìm thấy tin nhắn"]);
                exit;
            }
            
            $contactSubject = $contact['subject'] ? $contact['subject'] : 'Tin nhắn từ nguyenvanhao.name.vn';
            $subject = "Re: " . $contactSubject;
            $htmlBody = "
                <p style='margin:0 0 8px;color:#64748b;font-size:14px;'>Xin chào <strong>{$contact['name']}</strong>,</p>
                <div style='line-height:1.7;font-size:15px;color:#334155;margin:16px 0;white-space:pre-wrap;'>" . nl2br(htmlspecialchars($replyBody)) . "</div>
                <p style='margin:24px 0 0;color:#64748b;font-size:14px;'>Trân trọng,<br><strong>" . MAIL_FROM_NAME . "</strong></p>
            ";
            
            if (!file_exists(__DIR__ . '/mailer.php')) {
                echo json_encode(["success" => false, "error" => "Thiếu module mailer"]);
                exit;
            }
            require_once __DIR__ . '/mailer.php';
            
            $success = Mailer::send($contact['email'], $subject, $htmlBody, MAIL_FROM);
            
            if ($success) {
                $update = $db->prepare("UPDATE contact_submissions SET status = 'replied' WHERE id = ?");
                $update->execute([$id]);
                echo json_encode(["success" => true, "message" => "Đã gửi email trả lời!"]);
            } else {
                echo json_encode(["success" => false, "error" => "Lỗi cấu hình server mail"]);
            }
            exit;
        }
        
        // Normal status update
        $id = $data->id ?? null;
        $status = $data->status ?? null;
        
        if (!$id || !$status) {
            http_response_code(400);
            echo json_encode(["error" => "Thiếu id hoặc status"]);
            exit;
        }

        try {
            $stmt = $db->prepare("UPDATE contact_submissions SET status = ? WHERE id = ?");
            $stmt->execute([$status, $id]);
            echo json_encode(["success" => true]);
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
            $stmt = $db->prepare("DELETE FROM contact_submissions WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(["success" => true, "message" => "Đã xóa tin nhắn"]);
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
