<?php
header('Content-Type: application/json');
require_once 'db.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;

switch($method) {
    case 'GET':
        // Check for count param
        if (isset($_GET['count'])) {
            $stmt = $db->query("SELECT COUNT(*) as exact FROM images");
            echo json_encode($stmt->fetch());
        } else {
            $stmt = $db->query("SELECT * FROM images ORDER BY created_at DESC");
            $images = $stmt->fetchAll();
            echo json_encode(['data' => $images]);
        }
        break;
    case 'POST':
        // Auth Check
        session_start();
        if (!isset($_SESSION['user_id'])) {
            http_response_code(401);
            echo json_encode(["error" => "Unauthorized"]);
            exit;
        }

        $data = json_decode(file_get_contents("php://input"));

        if (!empty($data->filename) && !empty($data->url)) {
            try {
                $stmt = $db->prepare("INSERT INTO images (filename, url, alt_text) VALUES (?, ?, ?)");
                $stmt->execute([
                    $data->filename,
                    $data->url,
                    $data->alt_text ?? ''
                ]);
                echo json_encode(["success" => true, "message" => "Image added to DB"]);
            } catch(PDOException $e) {
                http_response_code(500);
                echo json_encode(["error" => $e->getMessage()]);
            }
        } else {
             http_response_code(400);
             echo json_encode(["error" => "Filename and URL required"]);
        }
        break;

    case 'DELETE':
        session_start();
        if (!isset($_SESSION['user_id'])) {
            http_response_code(401);
            echo json_encode(["error" => "Unauthorized"]);
            exit;
        }

        if ($id) {
             try {
                // First get the filename to delete from disk
                $stmt = $db->prepare("SELECT filename FROM images WHERE id = ?");
                $stmt->execute([$id]);
                $image = $stmt->fetch();

                if ($image) {
                     // Delete from DB
                    $delStmt = $db->prepare("DELETE FROM images WHERE id = ?");
                    $delStmt->execute([$id]);

                    // Attempt file delete (optional, might be risky if path logic differs)
                    // If filename is just "image.jpg", path is ../uploads/image.jpg
                    $filePath = __DIR__ . '/../uploads/' . $image['filename'];
                    if (file_exists($filePath)) {
                        unlink($filePath);
                    }
                    
                    echo json_encode(["success" => true, "message" => "Image deleted"]);
                } else {
                    http_response_code(404);
                    echo json_encode(["error" => "Image not found"]);
                }

            } catch(PDOException $e) {
                http_response_code(500);
                echo json_encode(["error" => $e->getMessage()]);
            }
        }
        break;
}
?>
