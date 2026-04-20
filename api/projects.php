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
            $stmt = $db->prepare("SELECT * FROM projects WHERE id = ?");
            $stmt->execute([$id]);
            $project = $stmt->fetch();
            if ($project) {
                echo json_encode($project);
            } else {
                http_response_code(404);
                echo json_encode(["error" => "Project not found"]);
            }
        } else {
            // Filter Params
            $is_published = isset($_GET['is_published']) ? ($_GET['is_published'] === 'true' || $_GET['is_published'] === '1') : null;
            $category = $_GET['category'] ?? null;
            $limit = isset($_GET['limit']) ? max(1, min((int)$_GET['limit'], 100)) : 50;
            
            $where = [];
            $p = [];
            
            if ($is_published !== null) {
                $where[] = "is_published = ?";
                $p[] = $is_published ? 1 : 0;
            }
            
            if ($category) {
                $where[] = "category = ?";
                $p[] = $category;
            }
            
            $sql = "SELECT * FROM projects";
            if (count($where) > 0) {
                $sql .= " WHERE " . implode(" AND ", $where);
            }
            
            $sql .= " ORDER BY sort_order ASC, created_at DESC LIMIT " . (int)$limit;
            
            try {
                $stmt = $db->prepare($sql);
                $stmt->execute($p);
                $projects = $stmt->fetchAll();
                echo json_encode(['data' => $projects]);
            } catch (PDOException $e) {
                // If table doesn't exist, return empty data
                echo json_encode(['data' => []]);
            }
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

        // Bulk Delete Action
        if (isset($data->action) && $data->action === 'delete' && isset($data->ids) && is_array($data->ids)) {
            $ids = array_map('intval', $data->ids);
            if (count($ids) === 0) {
                http_response_code(400);
                echo json_encode(["error" => "No IDs provided"]);
                exit;
            }
            $placeholders = implode(',', array_fill(0, count($ids), '?'));
            $stmt = $db->prepare("DELETE FROM projects WHERE id IN ($placeholders)");
            $stmt->execute($ids);
            echo json_encode(["success" => true, "message" => "Deleted " . $stmt->rowCount() . " projects"]);
            exit;
        }

        // Validate Input for Creation
        if (empty($data->title)) {
            http_response_code(400);
            echo json_encode(["error" => "Title is required"]);
            exit;
        }

        $title = $data->title;
        $description = $data->description ?? '';
        $image_url = $data->image_url ?? '';
        $project_url = $data->project_url ?? '';
        $category = $data->category ?? '';
        $sort_order = isset($data->sort_order) ? (int)$data->sort_order : 0;
        $is_published = isset($data->is_published) ? (int)$data->is_published : 1;

        $query = "INSERT INTO projects (title, description, image_url, project_url, category, sort_order, is_published) 
                  VALUES (?, ?, ?, ?, ?, ?, ?)";
        
        $stmt = $db->prepare($query);
        if ($stmt->execute([$title, $description, $image_url, $project_url, $category, $sort_order, $is_published])) {
            $newId = $db->lastInsertId();
            echo json_encode([
                "success" => true,
                "message" => "Dự án đã được tạo thành công.",
                "project" => [
                    "id" => $newId,
                    "title" => $title,
                    "is_published" => $is_published
                ]
            ]);
        } else {
            http_response_code(500);
            echo json_encode(["error" => "Unable to create project."]);
        }
        break;

    case 'PUT':
        // Auth Check
        session_start();
        if (!isset($_SESSION['user_id'])) {
            http_response_code(401);
            echo json_encode(["error" => "Unauthorized"]);
            exit;
        }

        if (!$id) {
            http_response_code(400);
            echo json_encode(["error" => "ID is required"]);
            exit;
        }

        $data = json_decode(file_get_contents("php://input"));
        
        // Allowed fields for update
        $fields = [];
        $params = [];
        
        if (isset($data->title)) {
            $fields[] = "title = ?";
            $params[] = $data->title;
        }
        if (isset($data->description)) {
            $fields[] = "description = ?";
            $params[] = $data->description;
        }
        if (isset($data->image_url)) {
            $fields[] = "image_url = ?";
            $params[] = $data->image_url;
        }
        if (isset($data->project_url)) {
            $fields[] = "project_url = ?";
            $params[] = $data->project_url;
        }
        if (isset($data->category)) {
            $fields[] = "category = ?";
            $params[] = $data->category;
        }
        if (isset($data->sort_order)) {
            $fields[] = "sort_order = ?";
            $params[] = (int)$data->sort_order;
        }
        if (isset($data->is_published)) {
            $fields[] = "is_published = ?";
            $params[] = (int)$data->is_published;
        }
        
        if (count($fields) > 0) {
            $params[] = $id;
            $query = "UPDATE projects SET " . implode(", ", $fields) . " WHERE id = ?";
            $stmt = $db->prepare($query);
            
            if ($stmt->execute($params)) {
                echo json_encode(["success" => true, "message" => "Cập nhật dự án thành công."]);
            } else {
                http_response_code(500);
                echo json_encode(["error" => "Không thể cập nhật dự án."]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["error" => "No data provided to update"]);
        }
        break;

    case 'DELETE':
        // Auth Check
        session_start();
        if (!isset($_SESSION['user_id'])) {
            http_response_code(401);
            echo json_encode(["error" => "Unauthorized"]);
            exit;
        }

        if (!$id) {
            http_response_code(400);
            echo json_encode(["error" => "ID is required"]);
            exit;
        }

        $stmt = $db->prepare("DELETE FROM projects WHERE id = ?");
        if ($stmt->execute([$id])) {
            echo json_encode(["success" => true, "message" => "Xóa dự án thành công."]);
        } else {
            http_response_code(500);
            echo json_encode(["error" => "Lỗi khi xóa dự án."]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(["error" => "Method Not Allowed"]);
        break;
}
