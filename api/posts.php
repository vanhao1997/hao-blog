<?php
header('Content-Type: application/json');
require_once 'db.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;
$slug = $_GET['slug'] ?? null;

// Handle Languages
$lang = $_GET['lang'] ?? $_SERVER['HTTP_X_LANG'] ?? 'vi';
$isTranslated = in_array($lang, ['en', 'fr', 'ja']);

$postSelects = "p.*";
$joinTranslation = "";

if ($isTranslated) {
    // Safe to use standard concatenation since $lang is verified against allowlist
    $postSelects = "p.id, p.category_id, p.slug, p.featured_image, p.created_at, p.updated_at, p.is_published, p.views, p.scheduled_at, p.published_at, p.source_url, COALESCE(pt.title, p.title) as title, COALESCE(pt.excerpt, p.excerpt) as excerpt, COALESCE(pt.content, p.content) as content";
    $joinTranslation = " LEFT JOIN post_translations pt ON pt.post_id = p.id AND pt.lang = '$lang'";
}


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
            $stmt = $db->prepare("SELECT $postSelects, c.name as category_name, c.slug as category_slug, c.color as category_color FROM posts p LEFT JOIN categories c ON p.category_id = c.id $joinTranslation WHERE p.id = ?");
            $stmt->execute([$id]);
            $post = $stmt->fetch();
            echo json_encode($post);
        } elseif (isset($_GET['slug'])) {
            // Increment views count
            try {
                $updateViews = $db->prepare("UPDATE posts SET views = views + 1 WHERE slug = ?");
                $updateViews->execute([$_GET['slug']]);
            } catch (\Throwable $e) {} // Ignore if views column doesn't exist yet

            $stmt = $db->prepare("SELECT $postSelects, c.name as category_name, c.slug as category_slug, c.color as category_color FROM posts p LEFT JOIN categories c ON p.category_id = c.id $joinTranslation WHERE p.slug = ?");
            $stmt->execute([$_GET['slug']]);
            $post = $stmt->fetch();
            echo json_encode($post);
        } else {
            // Filter Params
            $is_published = isset($_GET['is_published']) ? ($_GET['is_published'] === 'true') : null;
            $category_id = $_GET['category_id'] ?? null;
            $limit = isset($_GET['limit']) ? max(1, min((int)$_GET['limit'], 500)) : 10;
            
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

            // For public queries, also publish scheduled posts whose time has arrived
            if ($is_published) {
                try {
                    $db->exec("UPDATE posts SET is_published = 1, published_at = scheduled_at WHERE is_published = 0 AND scheduled_at IS NOT NULL AND scheduled_at <= NOW()");
                } catch (\Throwable $e) {
                    // scheduled_at column may not exist yet — safe to ignore
                }
            }
            
            $sql = "SELECT $postSelects, c.name as category_name, c.slug as category_slug, c.color as category_color 
                    FROM posts p 
                    LEFT JOIN categories c ON p.category_id = c.id
                    $joinTranslation";
            
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

        // ===== BULK ACTIONS =====
        if (isset($data->action) && isset($data->ids) && is_array($data->ids)) {
            $ids = array_map('intval', $data->ids);
            if (count($ids) === 0) {
                http_response_code(400);
                echo json_encode(["error" => "No IDs provided"]);
                exit;
            }
            $placeholders = implode(',', array_fill(0, count($ids), '?'));
            
            try {
                switch ($data->action) {
                    case 'delete':
                        $stmt = $db->prepare("DELETE FROM posts WHERE id IN ($placeholders)");
                        $stmt->execute($ids);
                        echo json_encode(["success" => true, "message" => "Deleted " . $stmt->rowCount() . " posts"]);
                        break;
                    case 'publish':
                        $stmt = $db->prepare("UPDATE posts SET is_published = 1, published_at = COALESCE(published_at, NOW()), updated_at = NOW() WHERE id IN ($placeholders)");
                        $stmt->execute($ids);
                        echo json_encode(["success" => true, "message" => "Published " . $stmt->rowCount() . " posts"]);
                        break;
                    case 'unpublish':
                        $stmt = $db->prepare("UPDATE posts SET is_published = 0, updated_at = NOW() WHERE id IN ($placeholders)");
                        $stmt->execute($ids);
                        echo json_encode(["success" => true, "message" => "Unpublished " . $stmt->rowCount() . " posts"]);
                        break;
                    default:
                        http_response_code(400);
                        echo json_encode(["error" => "Unknown action: " . $data->action]);
                }
            } catch(PDOException $e) {
                http_response_code(500);
                echo json_encode(["error" => "Lỗi hệ thống. Vui lòng thử lại."]);
            }
            exit;
        }

        // ===== CREATE POST =====
        if (!empty($data->title)) {
            try {
                $query = "INSERT INTO posts (title, slug, excerpt, content, featured_image, category_id, is_published, read_time, published_at, scheduled_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
                $stmt = $db->prepare($query);
                
                $baseSlug = $data->slug ?? strtolower(str_replace(' ', '-', $data->title));
                $slug = generateUniqueSlug($db, $baseSlug);
                
                // Handle scheduling
                $scheduled_at = null;
                $is_published = $data->is_published ? 1 : 0;
                $published_at = null;

                if (!empty($data->scheduled_at)) {
                    // Schedule for future — save as draft with scheduled_at set
                    $scheduled_at = $data->scheduled_at;
                    $is_published = 0;
                    $published_at = null;
                } elseif ($data->is_published) {
                    $published_at = date('Y-m-d H:i:s');
                }

                $categoryId = (!empty($data->category_id)) ? $data->category_id : null;

                $stmt->execute([
                    $data->title,
                    $slug,
                    $data->excerpt ?? '',
                    $data->content ?? '',
                    $data->featured_image ?? '',
                    $categoryId,
                    $is_published,
                    $data->read_time ?? '5 phút đọc',
                    $published_at,
                    $scheduled_at
                ]);
                $newId = $db->lastInsertId();
                echo json_encode(["success" => true, "message" => "Post created", "id" => $newId, "slug" => $slug]);
            } catch(PDOException $e) {
                http_response_code(500);
                echo json_encode(["error" => "Lỗi hệ thống. Vui lòng thử lại."]);
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
                        $fields[] = "published_at = COALESCE(published_at, NOW())";
                        // Clear schedule if publishing now
                        $fields[] = "scheduled_at = NULL";
                    }
                }
                if (isset($data->read_time)) { $fields[] = "read_time = ?"; $params[] = $data->read_time; }
                if (isset($data->scheduled_at)) {
                    if ($data->scheduled_at) {
                        $fields[] = "scheduled_at = ?"; $params[] = $data->scheduled_at;
                        // If scheduling, set as draft
                        $fields[] = "is_published = 0";
                    } else {
                        $fields[] = "scheduled_at = NULL";
                    }
                }

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
                echo json_encode(["error" => "Lỗi hệ thống. Vui lòng thử lại."]);
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
                echo json_encode(["error" => "Lỗi hệ thống. Vui lòng thử lại."]);
            }
        }
        break;
}
?>
