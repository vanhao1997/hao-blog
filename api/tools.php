<?php
header('Content-Type: application/json');
require_once 'db.php';

$database = new Database();
$db = $database->getConnection();

session_start();
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(["error" => "Unauthorized"]);
    exit;
}

$action = $_GET['action'] ?? '';

switch ($action) {
    // ===== SEO AUDIT =====
    case 'seo-audit':
        $stmt = $db->query("SELECT id, title, slug, excerpt, content, featured_image FROM posts WHERE is_published = 1");
        $posts = $stmt->fetchAll();
        $results = [];
        foreach ($posts as $post) {
            $issues = [];
            $score = 100;
            // Title length
            $titleLen = mb_strlen($post['title']);
            if ($titleLen < 30) { $issues[] = "Tiêu đề quá ngắn ($titleLen ký tự, nên >= 30)"; $score -= 10; }
            if ($titleLen > 75) { $issues[] = "Tiêu đề quá dài ($titleLen ký tự, nên <= 75)"; $score -= 10; }
            // Excerpt
            $excLen = mb_strlen($post['excerpt'] ?? '');
            if ($excLen < 50) { $issues[] = "Mô tả quá ngắn ($excLen ký tự, nên >= 50)"; $score -= 15; }
            if ($excLen > 165) { $issues[] = "Mô tả quá dài ($excLen ký tự, nên <= 165)"; $score -= 5; }
            // No featured image
            if (empty($post['featured_image'])) { $issues[] = "Thiếu ảnh đại diện"; $score -= 15; }
            // Content too short
            $contentLen = mb_strlen(strip_tags($post['content'] ?? ''));
            if ($contentLen < 300) { $issues[] = "Nội dung quá ngắn ($contentLen ký tự)"; $score -= 20; }
            // No headings in content
            if (!preg_match('/<h[23]/', $post['content'] ?? '')) { $issues[] = "Không có heading H2/H3 trong nội dung"; $score -= 10; }
            // No images in content
            if (!preg_match('/<img/', $post['content'] ?? '')) { $issues[] = "Không có hình ảnh trong nội dung"; $score -= 5; }
            // No internal links
            if (!preg_match('/href=["\']\//', $post['content'] ?? '')) { $issues[] = "Không có internal link"; $score -= 5; }

            $results[] = [
                'id' => $post['id'],
                'title' => $post['title'],
                'slug' => $post['slug'],
                'score' => max(0, $score),
                'issues' => $issues
            ];
        }
        // Sort by score ascending (worst first)
        usort($results, function($a, $b) { return $a['score'] - $b['score']; });
        echo json_encode(['data' => $results, 'total' => count($results), 'avg_score' => count($results) > 0 ? round(array_sum(array_column($results, 'score')) / count($results)) : 0]);
        break;

    // ===== MEDIA CLEANUP =====
    case 'media-cleanup':
        // Find images in DB not used by any post
        $stmt = $db->query("SELECT id, filename, url, alt_text, created_at FROM images");
        $allImages = $stmt->fetchAll();
        
        $stmt = $db->query("SELECT content, featured_image FROM posts");
        $allPosts = $stmt->fetchAll();
        
        // Build a list of all URLs referenced in posts
        $usedUrls = [];
        foreach ($allPosts as $post) {
            if (!empty($post['featured_image'])) $usedUrls[] = $post['featured_image'];
            // Extract img src from content
            preg_match_all('/src=["\']([^"\']+)["\']/i', $post['content'] ?? '', $matches);
            foreach ($matches[1] as $src) $usedUrls[] = $src;
        }
        $usedUrls = array_unique($usedUrls);
        
        $orphans = [];
        foreach ($allImages as $img) {
            if (!in_array($img['url'], $usedUrls)) {
                $orphans[] = $img;
            }
        }
        
        echo json_encode([
            'total_images' => count($allImages),
            'used_count' => count($allImages) - count($orphans),
            'orphan_count' => count($orphans),
            'orphans' => $orphans
        ]);
        break;

    // ===== MEDIA CLEANUP - DELETE ORPHANS =====
    case 'media-cleanup-delete':
        $data = json_decode(file_get_contents("php://input"));
        $ids = $data->ids ?? [];
        if (empty($ids)) {
            echo json_encode(["error" => "No IDs"]);
            exit;
        }
        $deleted = 0;
        foreach ($ids as $id) {
            $stmt = $db->prepare("SELECT filename FROM images WHERE id = ?");
            $stmt->execute([$id]);
            $img = $stmt->fetch();
            if ($img) {
                $filePath = __DIR__ . '/../uploads/' . $img['filename'];
                if (file_exists($filePath)) unlink($filePath);
                $db->prepare("DELETE FROM images WHERE id = ?")->execute([$id]);
                $deleted++;
            }
        }
        echo json_encode(["success" => true, "deleted" => $deleted]);
        break;

    // ===== BACKUP & EXPORT =====
    case 'backup':
        $posts = $db->query("SELECT * FROM posts ORDER BY created_at DESC")->fetchAll();
        $categories = $db->query("SELECT * FROM categories ORDER BY sort_order ASC")->fetchAll();
        $images = $db->query("SELECT * FROM images ORDER BY created_at DESC")->fetchAll();
        
        $backup = [
            'exported_at' => date('Y-m-d H:i:s'),
            'version' => '1.0',
            'stats' => [
                'posts' => count($posts),
                'categories' => count($categories),
                'images' => count($images)
            ],
            'categories' => $categories,
            'posts' => $posts,
            'images' => $images
        ];
        echo json_encode($backup, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        break;

    default:
        http_response_code(400);
        echo json_encode(["error" => "Unknown action. Use: seo-audit, media-cleanup, media-cleanup-delete, backup"]);
}
?>
