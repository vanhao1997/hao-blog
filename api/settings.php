<?php
header('Content-Type: application/json');
require_once 'db.php';

$database = new Database();
$db = $database->getConnection();

// Create settings table if not exists
try {
    $db->exec("CREATE TABLE IF NOT EXISTS settings (
        `setting_key` VARCHAR(50) PRIMARY KEY,
        `setting_value` TEXT
    )");
    
    // Seed default data if empty
    $stmt = $db->query("SELECT COUNT(*) FROM settings");
    if ($stmt->fetchColumn() == 0) {
        $defaultMenu = '[{"name":"Trang chủ","url":"/"},{"name":"Blog","url":"/blog"},{"name":"Giới thiệu","url":"/gioi-thieu"},{"name":"Liên hệ","url":"/lien-he"},{"name":"Công cụ","url":"/toolkit/"}]';
        $defaultFooter = '{"contact":"contact@nguyenvanhao.name.vn","zalo":"0368419289","address":"Việt Nam"}';
        $defaultScripts = '<!-- Theo dõi (GTM, FB Pixel) sẽ chèn vào đây -->';
        
        $db->prepare("REPLACE INTO settings (setting_key, setting_value) VALUES (?, ?)")->execute(['header_menu', $defaultMenu]);
        $db->prepare("REPLACE INTO settings (setting_key, setting_value) VALUES (?, ?)")->execute(['footer_info', $defaultFooter]);
        $db->prepare("REPLACE INTO settings (setting_key, setting_value) VALUES (?, ?)")->execute(['custom_scripts', $defaultScripts]);
    }
} catch (\Throwable $e) {}

$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        // Public endpoint to get all settings
        try {
            $stmt = $db->query("SELECT setting_key, setting_value FROM settings");
            $results = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
            echo json_encode(["success" => true, "data" => $results]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["error" => $e->getMessage()]);
        }
        break;

    case 'POST':
        // Admin only endpoint to save settings
        session_start();
        if (!isset($_SESSION['user_id'])) {
            http_response_code(401);
            echo json_encode(["error" => "Unauthorized"]);
            exit;
        }

        $data = json_decode(file_get_contents("php://input"), true);
        if (!$data) {
            http_response_code(400);
            echo json_encode(["error" => "Invalid JSON payload"]);
            exit;
        }

        try {
            $db->beginTransaction();
            $stmt = $db->prepare("REPLACE INTO settings (setting_key, setting_value) VALUES (?, ?)");

            foreach ($data as $key => $val) {
                if ($key === 'action') continue;
                // Arrays (like menu) are stored as JSON strings
                $valueStr = is_array($val) ? json_encode($val, JSON_UNESCAPED_UNICODE) : (string)$val;
                $stmt->execute([$key, $valueStr]);
            }
            $db->commit();
            echo json_encode(["success" => true, "message" => "Cấu hình đã được lưu thành công"]);
        } catch (PDOException $e) {
            $db->rollBack();
            http_response_code(500);
            echo json_encode(["error" => "Lỗi CSDL: " . $e->getMessage()]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(["error" => "Method not allowed"]);
}
?>
