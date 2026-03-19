<?php
header('Content-Type: application/json');
require_once 'db.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;

switch($method) {
    case 'GET':
        if ($id) {
            $stmt = $db->prepare("SELECT * FROM categories WHERE id = ?");
            $stmt->execute([$id]);
            $category = $stmt->fetch();
            echo json_encode($category);
            exit;
        } else {
            // Count posts if requested
            if (isset($_GET['count'])) {
                $stmt = $db->query("SELECT COUNT(*) as exact FROM categories");
                echo json_encode($stmt->fetch());
                exit;
            } else {
                // Default Sort: Sort Order ASC, then Name ASC
                $stmt = $db->query("SELECT * FROM categories ORDER BY sort_order ASC, name ASC");
                $categories = $stmt->fetchAll();
                echo json_encode($categories);
            }
        }
        break;

    case 'POST':
        // Auth check (simple session check)
        session_start();
        if (!isset($_SESSION['user_id'])) {
            http_response_code(401);
            echo json_encode(["error" => "Unauthorized"]);
            exit;
        }

        $data = json_decode(file_get_contents("php://input"));
        $action = $_GET['action'] ?? null;

        // Reorder Action
        if ($action === 'reorder') {
            if (!isset($data->id) || !isset($data->direction)) {
                 http_response_code(400);
                 echo json_encode(["error" => "Missing parameters"]);
                 exit;
            }

            try {
                $db->beginTransaction();

                // Get current category
                $stmt = $db->prepare("SELECT id, sort_order FROM categories WHERE id = ?");
                $stmt->execute([$data->id]);
                $current = $stmt->fetch();

                if (!$current) throw new Exception("Category not found");

                $currentOrder = (int)$current['sort_order'];

                // Find neighbor
                if ($data->direction === 'up') {
                    $stmt = $db->prepare("SELECT id, sort_order FROM categories WHERE sort_order < ? ORDER BY sort_order DESC LIMIT 1");
                } else {
                    $stmt = $db->prepare("SELECT id, sort_order FROM categories WHERE sort_order > ? ORDER BY sort_order ASC LIMIT 1");
                }
                $stmt->execute([$currentOrder]);
                $neighbor = $stmt->fetch();

                if ($neighbor) {
                    $neighborOrder = (int)$neighbor['sort_order'];

                    // Swap
                    $update1 = $db->prepare("UPDATE categories SET sort_order = ? WHERE id = ?");
                    $update1->execute([$neighborOrder, $current['id']]);

                    $update2 = $db->prepare("UPDATE categories SET sort_order = ? WHERE id = ?");
                    $update2->execute([$currentOrder, $neighbor['id']]);
                }

                $db->commit();
                echo json_encode(["success" => true]);
            } catch (Exception $e) {
                $db->rollBack();
                http_response_code(500);
                echo json_encode(["error" => $e->getMessage()]);
            }
            exit;
        }
        
        if (!empty($data->name) && !empty($data->slug)) {
            try {
                // Get max sort_order
                $stmtOrder = $db->query("SELECT MAX(sort_order) as max_order FROM categories");
                $maxOrder = $stmtOrder->fetch()['max_order'] ?? 0;
                $newOrder = $maxOrder + 1;

                $stmt = $db->prepare("INSERT INTO categories (name, slug, color, sort_order) VALUES (?, ?, ?, ?)");
                $stmt->execute([$data->name, $data->slug, $data->color ?? '#22C55E', $newOrder]);
                echo json_encode(["success" => true, "message" => "Category created"]);
            } catch(PDOException $e) {
                http_response_code(500);
                echo json_encode(["error" => $e->getMessage()]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["error" => "Incomplete data"]);
        }
        break;

    case 'PUT': // Using POST for form simplicity or true PUT
        session_start();
        if (!isset($_SESSION['user_id'])) {
            http_response_code(401);
            echo json_encode(["error" => "Unauthorized"]);
            exit;
        }

        $data = json_decode(file_get_contents("php://input"));
        
        // Support ID in URL or Body
        $updateId = $id ?? $data->id;

        if ($updateId && !empty($data->name) && !empty($data->slug)) {
             try {
                $stmt = $db->prepare("UPDATE categories SET name = ?, slug = ?, color = ? WHERE id = ?");
                $stmt->execute([$data->name, $data->slug, $data->color ?? '#22C55E', $updateId]);
                echo json_encode(["success" => true, "message" => "Category updated"]);
            } catch(PDOException $e) {
                http_response_code(500);
                echo json_encode(["error" => $e->getMessage()]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["error" => "ID, name and slug are required"]);
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
                $stmt = $db->prepare("DELETE FROM categories WHERE id = ?");
                $stmt->execute([$id]);
                echo json_encode(["success" => true, "message" => "Category deleted"]);
            } catch(PDOException $e) {
                http_response_code(500);
                echo json_encode(["error" => $e->getMessage()]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["error" => "ID is required"]);
        }
        break;
}
?>
