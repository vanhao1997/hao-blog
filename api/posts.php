<?php
header('Content-Type: application/json');
require_once 'db.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;
$slug = $_GET['slug'] ?? null;

function generateUniqueSlug($db, $slug, $excludeId = null) {
    $originalSlug = $slug;
    $count = 1;
    
    while (true) {
        $sql = "SELECT COUNT(*) FROM posts WHERE slug = ?";
        $params = [$slug];
        
        if ($excludeId) {
            $sql .= " AND id != ?";
            $params[] = $excludeId;
        }
        
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        
        if ($stmt->fetchColumn() == 0) {
            return $slug;
        }
        
        $slug = $originalSlug . '-' . $count;
        $count++;
    }
}

switch($method) {
    case 'GET':
        if (isset($_GET['count'])) {
            $where = [];
            $p = [];
            if (isset($_GET['is_published'])) {
                $where[] = "is_published = ?";
                $p[] = ($_GET['is_published'] === 'true' ? 1 : 0);
            }
            if (!empty($_GET['category_id'])) {
                $where[] = "category_id = ?";
                $p[] = $_GET['category_id'];
            }
            $sql = "SELECT COUNT(*) as exact FROM posts";
            if (count($where) > 0) $sql .= " WHERE " . implode(" AND ", $where);
            
            $stmt = $db->prepare($sql);
            $stmt->execute($p);
            echo json_encode($stmt->fetch());
            exit;
        } elseif ($id) {
            $stmt = $db->prepare("SELECT p.*, c.name as category_name, c.slug as category_slug, c.color as category_color FROM posts p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?");
            $stmt->execute([$id]);
            $post = $stmt->fetch();
            echo json_encode($post);
        } elseif (isset($_GET['slug'])) {
            $stmt = $db->prepare("SELECT p.*, c.name as category_name, c.slug as category_slug, c.color as category_color FROM posts p LEFT JOIN categories c ON p.category_id = c.id WHERE p.slug = ?");
            $stmt->execute([$_GET['slug']]);
            $post = $stmt->fetch();
            echo json_encode($post);
        } else {
            // Filter Params
            $is_published = isset($_GET['is_published']) ? ($_GET['is_published'] === 'true') : null;
            $category_id = $_GET['category_id'] ?? null;
            $limit = isset($_GET['limit']) ? max(1, min((int)$_GET['limit'], 100)) : 10;
            
            $where = [];
            $p = [];
            
            if ($is_published !== null) {
                $where[] = "p.is_published = ?";
                $p[] = $is_published ? 1 : 0;
            }
            
            if ($category_id) {
                $where[] = "p.category_id = ?";
                $p[] = $category_id;
            }
            
            $sql = "SELECT p.*, c.name as category_name, c.slug as category_slug, c.color as category_color 
                    FROM posts p 
                    LEFT JOIN categories c ON p.category_id = c.id";
            
            if (count($where) > 0) {
                $sql .= " WHERE " . implode(" AND ", $where);
            }
            
            $sql .= " ORDER BY p.created_at DESC LIMIT " . (int)$limit;
            
            $stmt = $db->prepare($sql);
            $stmt->execute($p);
            $posts = $stmt->fetchAll();
            echo json_encode(['data' => $posts]);
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

        if (!empty($data->title)) {
            try {
                $query = "INSERT INTO posts (title, slug, excerpt, content, featured_image, category_id, is_published, read_time, published_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
                $stmt = $db->prepare($query);
                
                $baseSlug = $data->slug ?? strtolower(str_replace(' ', '-', $data->title));
                $slug = generateUniqueSlug($db, $baseSlug);
                $published_at = $data->is_published ? date('Y-m-d H:i:s') : null;
                // Convert empty category_id to null to avoid FK constraint violation
                $categoryId = (!empty($data->category_id)) ? $data->category_id : null;

                $stmt->execute([
                    $data->title,
                    $slug,
                    $data->excerpt ?? '',
                    $data->content ?? '',
                    $data->featured_image ?? '',
                    $categoryId,
                    $data->is_published ? 1 : 0,
                    $data->read_time ?? '5 phút đọc',
                    $published_at
                ]);
                echo json_encode(["success" => true, "message" => "Post created"]);
            } catch(PDOException $e) {
                http_response_code(500);
                echo json_encode(["error" => $e->getMessage()]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["error" => "Title is required"]);
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

        $data = json_decode(file_get_contents("php://input"));
        $updateId = $id ?? $data->id;

        if ($updateId) {
             try {
                $fields = [];
                $params = [];
                
                // Dynamic Update
                if (isset($data->title)) { $fields[] = "title = ?"; $params[] = $data->title; }
                if (isset($data->slug)) { 
                    $fields[] = "slug = ?"; 
                    // Verify uniqueness even on update
                    $params[] = generateUniqueSlug($db, $data->slug, $updateId); 
                }
                if (isset($data->excerpt)) { $fields[] = "excerpt = ?"; $params[] = $data->excerpt; }
                if (isset($data->content)) { $fields[] = "content = ?"; $params[] = $data->content; }
                if (isset($data->featured_image)) { $fields[] = "featured_image = ?"; $params[] = $data->featured_image; }
                if (isset($data->category_id)) { $fields[] = "category_id = ?"; $params[] = ($data->category_id !== '' && $data->category_id !== null) ? $data->category_id : null; }
                if (isset($data->is_published)) { 
                    $fields[] = "is_published = ?"; 
                    $params[] = $data->is_published ? 1 : 0; 
                    if ($data->is_published) {
                        $fields[] = "published_at = ?";
                        $params[] = date('Y-m-d H:i:s');
                    }
                }
                if (isset($data->read_time)) { $fields[] = "read_time = ?"; $params[] = $data->read_time; }

                $fields[] = "updated_at = NOW()";

                if (count($fields) > 0) {
                    $sql = "UPDATE posts SET " . implode(", ", $fields) . " WHERE id = ?";
                    $params[] = $updateId;

                    $stmt = $db->prepare($sql);
                    $stmt->execute($params);
                    echo json_encode(["success" => true, "message" => "Post updated"]);
                } else {
                    echo json_encode(["success" => true, "message" => "No changes made"]);
                }

            } catch(PDOException $e) {
                http_response_code(500);
                echo json_encode(["error" => $e->getMessage()]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["error" => "ID is required for update"]);
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
                $stmt = $db->prepare("DELETE FROM posts WHERE id = ?");
                $stmt->execute([$id]);
                echo json_encode(["success" => true, "message" => "Post deleted"]);
            } catch(PDOException $e) {
                http_response_code(500);
                echo json_encode(["error" => $e->getMessage()]);
            }
        }
        break;
}
?>
