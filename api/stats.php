<?php
header('Content-Type: application/json');
require_once 'db.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    // Fetch counts efficiently
    $postsTotal = $db->query("SELECT COUNT(*) FROM posts")->fetchColumn();
    $postsPublished = $db->query("SELECT COUNT(*) FROM posts WHERE is_published = 1")->fetchColumn();
    $imagesTotal = $db->query("SELECT COUNT(*) FROM images")->fetchColumn();

    // Total Views
    $totalViews = 0;
    try {
        $totalViews = $db->query("SELECT SUM(views) FROM posts")->fetchColumn();
    } catch (\Throwable $e) {}

    // Top Posts
    $topPosts = [];
    try {
        $stmt = $db->query("SELECT title, slug, views FROM posts WHERE is_published = 1 ORDER BY views DESC LIMIT 5");
        $topPosts = $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (\Throwable $e) {}

    echo json_encode([
        'success' => true,
        'posts_total' => $postsTotal,
        'posts_published' => $postsPublished,
        'posts_draft' => $postsTotal - $postsPublished,
        'images_total' => $imagesTotal,
        'total_views' => (int)$totalViews,
        'top_posts' => $topPosts
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
