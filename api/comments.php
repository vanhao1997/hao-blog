<?php
header('Content-Type: application/json');
require_once 'db.php';

$database = new Database();
$db = $database->getConnection();

// Auto-create table
try {
    $db->exec("CREATE TABLE IF NOT EXISTS comments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        post_id INT NOT NULL,
        author_name VARCHAR(100) NOT NULL,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_approved TINYINT(1) DEFAULT 1,
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
    )");
} catch (\Throwable $e) {}

$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        $postId = $_GET['post_id'] ?? null;
        if (!$postId) {
            http_response_code(400);
            echo json_encode(["error" => "Missing post_id"]);
            exit;
        }
        
        try {
            $stmt = $db->prepare("SELECT id, author_name, content, created_at FROM comments WHERE post_id = ? AND is_approved = 1 ORDER BY created_at ASC");
            $stmt->execute([$postId]);
            $comments = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode(["success" => true, "data" => $comments]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["error" => $e->getMessage()]);
        }
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"));
        $postId = $data->post_id ?? null;
        $author = trim($data->author_name ?? '');
        $content = trim($data->content ?? '');

        if (!$postId || !$author || !$content) {
            http_response_code(400);
            echo json_encode(["error" => "Vui lòng nhập đầy đủ tên và bình luận."]);
            exit;
        }

        try {
            // Basic spam protection (auto-flag links)
            $is_approved = preg_match('/http|www|\.com/i', $content) ? 0 : 1;

            $stmt = $db->prepare("INSERT INTO comments (post_id, author_name, content, is_approved) VALUES (?, ?, ?, ?)");
            $stmt->execute([$postId, htmlspecialchars($author), htmlspecialchars($content), $is_approved]);
            
            echo json_encode([
                "success" => true, 
                "message" => $is_approved ? "Đã gửi bình luận!" : "Bình luận của bạn đang chờ duyệt.",
                "comment" => [
                    "id" => $db->lastInsertId(),
                    "author_name" => htmlspecialchars($author),
                    "content" => htmlspecialchars($content),
                    "created_at" => date('Y-m-d H:i:s'),
                    "is_approved" => $is_approved
                ]
            ]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["error" => "Lỗi CSDL: " . $e->getMessage()]);
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
        if ($id) {
            $db->prepare("DELETE FROM comments WHERE id = ?")->execute([$id]);
            echo json_encode(["success" => true]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(["error" => "Method not allowed"]);
}
?>
